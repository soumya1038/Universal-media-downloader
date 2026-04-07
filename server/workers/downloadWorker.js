import path from 'path';
import { mkdirSync, existsSync, statSync } from 'fs';
import { query } from '../db/index.js';
import { downloadMedia } from '../services/ytdlpService.js';
import { sanitizeFilename } from '../utils/sanitize.js';
import config from '../config/index.js';

// Ensure storage directories exist
const downloadDir = path.resolve(config.storage.downloadPath);
const tempDir = path.resolve(config.storage.tempPath);

if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

import { downloadQueue } from '../queue/index.js';

export const activeDownloads = new Map();

// Setup processor for the native in-memory queue
downloadQueue.process(async (job) => {
  const { jobId, url, format, quality, formatId } = job.data;

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
    const ext = format === 'mp3' || quality === 'audio' ? 'mp3' : (format || 'mp4');
    const outputFilename = `${safeTitle}_${jobId.substring(0, 8)}.${ext}`;
    const outputPath = path.join(downloadDir, outputFilename);

    // Update progress - downloading
    await query(
      'UPDATE jobs SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [30, jobId]
    );

    // Download media
    await downloadMedia(url, outputPath, format, quality, formatId, abortController.signal);

    // Update progress - processing complete
    await query(
      'UPDATE jobs SET progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [90, jobId]
    );

    // Find the actual output file (yt-dlp may change extension)
    let finalPath = outputPath;

    // Check for common yt-dlp output patterns
    const possibleExts = ['mp4', 'webm', 'mkv', 'mp3', 'm4a'];
    if (!existsSync(finalPath)) {
      for (const tryExt of possibleExts) {
        const tryPath = outputPath.replace(/\.[^.]+$/, `.${tryExt}`);
        if (existsSync(tryPath)) {
          finalPath = tryPath;
          break;
        }
      }
    }

    // Get file size
    let fileSize = null;
    if (existsSync(finalPath)) {
      fileSize = statSync(finalPath).size;
    }

    // Update job as completed
    await query(
      'UPDATE jobs SET status = ?, progress = ?, file_path = ?, file_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', 100, finalPath, fileSize, jobId]
    );

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
