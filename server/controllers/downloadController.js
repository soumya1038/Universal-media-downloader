import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';
import downloadQueue from '../queue/index.js';
import { detectPlatform, isDrmPlatform, getDrmPlatformInfo } from '../services/ytdlpService.js';
import { getDiskSpace } from '../utils/disk.js';
import config from '../config/index.js';

export async function startDownload(req, res) {
  try {
    const {
      url,
      format = 'mp4',
      quality = '720p',
      formatId,
      title,
      thumbnail,
      platform,
      author,
      duration,
      downloadMethod,
      sourceUrl,
    } = req.body;
    const jobId = uuidv4();
    const detectedPlatform = detectPlatform(url);

    if (isDrmPlatform(detectedPlatform)) {
      const drmInfo = getDrmPlatformInfo(detectedPlatform);
      return res.status(400).json({
        success: false,
        error: `${drmInfo?.displayName || detectedPlatform} is DRM protected and cannot be downloaded here.`,
      });
    }

    if (sourceUrl && isDrmPlatform(detectPlatform(sourceUrl))) {
      return res.status(400).json({
        success: false,
        error: 'The resolved source URL is DRM protected and cannot be downloaded here.',
      });
    }

    // Check disk space before queuing job
    const { freeBytes } = await getDiskSpace(config.storage?.downloadPath || '.');
    const minFreeBytes = 250 * 1024 * 1024; // Require at least 250MB free space
    if (freeBytes < minFreeBytes) {
      return res.status(507).json({
        success: false,
        error: 'Insufficient disk storage space available on server.',
      });
    }

    // Insert job record
    await query(
      `INSERT INTO jobs (id, url, title, thumbnail, platform, author, duration, format, quality, status, download_method, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'queued', $10, $11)`,
      [jobId, url, title || 'Unknown', thumbnail, platform || detectedPlatform, author, duration, format, quality, downloadMethod || null, sourceUrl || null]
    );

    // Enqueue the job using our in-memory queue
    downloadQueue.add('download', {
      jobId,
      url,
      format,
      quality,
      formatId,
      downloadMethod,
      sourceUrl,
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
