import path from 'path';
import { mkdirSync, existsSync, statSync, readdirSync } from 'fs';
import { query } from '../db/index.js';
import { downloadMedia } from '../services/ytdlpService.js';
import { sanitizeFilename } from '../utils/sanitize.js';
import config from '../config/index.js';
import { broadcastEvent } from '../controllers/eventController.js';

// Ensure storage directories exist
const downloadDir = path.resolve(config.storage.downloadPath);
const tempDir = path.resolve(config.storage.tempPath);

if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

import { downloadQueue } from '../queue/index.js';

export const activeDownloads = new Map();

// Setup processor for the native in-memory queue
downloadQueue.process(async (job) => {
  const { jobId, url, format, quality, formatId, downloadMethod, sourceUrl } = job.data;

  console.log(`[Worker] Processing job ${jobId}: ${url} (formatId: ${formatId || 'N/A'})`);

  const abortController = new AbortController();
  activeDownloads.set(jobId, abortController);

  try {
    // Update status to processing
    await query(
      'UPDATE jobs SET status = ?, progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['processing', 10, jobId]
    );

    // Get job metadata for filename
    const jobResult = await query('SELECT title FROM jobs WHERE id = ?', [jobId]);
    const title = jobResult.rows[0]?.title || 'download';
    const safeTitle = sanitizeFilename(title);
    const outputBase = `${safeTitle}_${jobId.substring(0, 8)}`;
    const outputTemplate = path.join(downloadDir, `${outputBase}.%(ext)s`);

    // Update progress - downloading started
    await query(
      'UPDATE jobs SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [30, jobId]
    );

    let lastUpdate = 0;
    const onProgress = (prog) => {
      const now = Date.now();
      if (now - lastUpdate > 500) {
        lastUpdate = now;
        const scaledProgress = Math.floor(30 + (prog.percent * 0.6));
        // We use fire-and-forget for progression so it doesn't block the download
        query(
          'UPDATE jobs SET progress = ?, speed = ?, downloaded_bytes = ?, eta = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [scaledProgress, prog.speed || null, prog.downloaded || null, prog.eta || null, jobId]
        ).catch(e => console.error(`[Worker] Progress update error: ${e.message}`));

        // Real-Time Sub-100ms SSE Event Broadcast
        broadcastEvent('job_progress', {
          jobId,
          status: 'processing',
          progress: scaledProgress,
          speed: prog.speed || null,
          downloadedBytes: prog.downloaded || null,
          eta: prog.eta || null
        });
      }
    };

    // Auto-retry wrapper for network glitches
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        if (attempts > 1) {
          console.log(`[Worker] Job ${jobId} auto-retrying (attempt ${attempts}/${maxAttempts})...`);
          await query('UPDATE jobs SET retry_count = ?, speed = ? WHERE id = ?', [attempts - 1, `Retrying (${attempts}/${maxAttempts})...`, jobId]);
          await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempts - 2)));
        }

        // Download media
        await downloadMedia(url, outputTemplate, {
          format,
          quality,
          formatId,
          signal: abortController.signal,
          downloadMethod,
          sourceUrl,
          onProgress,
        });

        lastError = null;
        break; // Success! Exit retry loop.
      } catch (err) {
        lastError = err;
        if (err.code === 'ABORT_ERR') break; // Don't retry if manually cancelled
        const msg = err.message || '';
        const isTransient = msg.includes('timed out') || msg.includes('Connection reset') || msg.includes('HTTP Error 5') || msg.includes('Unable to download webpage');
        if (!isTransient) break; // Non-transient error, exit loop immediately
      }
    }

    if (lastError) {
      throw lastError;
    }

    // Update progress - processing complete
    await query(
      'UPDATE jobs SET progress = ?, speed = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [90, jobId]
    );

    // Find the actual output file (yt-dlp may change extension)
    let finalPath = path.join(downloadDir, `${outputBase}.${format || 'mp4'}`);
    const candidates = readdirSync(downloadDir)
      .filter((name) => name.startsWith(`${outputBase}.`))
      .map((name) => path.join(downloadDir, name));

    if (candidates.length > 0) {
      candidates.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
      finalPath = candidates[0];
    }

    if (!existsSync(finalPath)) {
      throw new Error('Downloaded file could not be located after completion.');
    }

    // Get file size
    let fileSize = null;
    fileSize = statSync(finalPath).size;

    // Update job as completed
    await query(
      'UPDATE jobs SET status = ?, progress = ?, file_path = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', 100, finalPath, fileSize, jobId]
    );

    broadcastEvent('job_progress', {
      jobId,
      status: 'completed',
      progress: 100,
      fileSize,
      downloadUrl: `/api/download-file/${jobId}`
    });

    console.log(`[Worker] Job ${jobId} completed: ${finalPath}`);
    return { success: true, filePath: finalPath };

  } catch (error) {
    if (error.code === 'ABORT_ERR') {
      console.log(`[Worker] Job ${jobId} was manually cancelled.`);
      return { success: false, cancelled: true };
    }

    console.error(`[Worker] Job ${jobId} failed:`, error.message);

    await query(
      'UPDATE jobs SET status = ?, error = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['failed', error.message, jobId]
    );

    throw error;
  } finally {
    activeDownloads.delete(jobId);
  }
});

console.log('[Worker] Download worker started.');

export default downloadQueue;
