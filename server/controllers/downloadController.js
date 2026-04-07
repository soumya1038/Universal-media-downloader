import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import downloadQueue from '../queue/index.js';
import { detectPlatform } from '../services/ytdlpService.js';

export async function startDownload(req, res) {
  try {
    const { url, format = 'mp4', quality = '720p', formatId, title, thumbnail, platform, author, duration } = req.body;
    const jobId = uuidv4();
    const detectedPlatform = platform || detectPlatform(url);

    // Insert job record
    await query(
      `INSERT INTO jobs (id, url, title, thumbnail, platform, author, duration, format, quality, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued')`,
      [jobId, url, title || 'Unknown', thumbnail, detectedPlatform, author, duration, format, quality]
    );

    // Enqueue the job using our in-memory queue
    downloadQueue.add('download', {
      jobId,
      url,
      format,
      quality,
      formatId,
    });

    res.json({
      success: true,
      data: {
        jobId,
        status: 'queued',
      },
    });
  } catch (error) {
    console.error('Download start error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to queue download.',
    });
  }
}

export async function cancelDownload(req, res) {
  try {
    const { jobId } = req.params;

    // Dynamically import activeDownloads map
    const { activeDownloads } = await import('../workers/downloadWorker.js');

    if (activeDownloads.has(jobId)) {
      activeDownloads.get(jobId).abort();
      activeDownloads.delete(jobId);
    }

    // Update the database to mark as failed/cancelled
    await query("UPDATE jobs SET status = 'failed', error = 'Cancelled by user' WHERE id = ? AND status != 'completed'", [jobId]);

    res.json({ success: true, message: 'Job cancelled' });
  } catch (error) {
    console.error('Cancel error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to cancel job.' });
  }
}
