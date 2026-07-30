import { query } from '../db/index.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

export async function getHistory(req, res) {
  try {
    const result = await query(
      'SELECT id, url, title, thumbnail, platform, format, quality, status, progress, speed, eta, file_path, file_size, error, created_at, updated_at FROM jobs ORDER BY created_at DESC LIMIT 50'
    );

    const jobs = result.rows.map(row => {
      let computedSize = row.file_size;
      if ((!computedSize || computedSize === 0) && row.file_path && fs.existsSync(row.file_path)) {
        try {
          computedSize = fs.statSync(row.file_path).size;
          query('UPDATE jobs SET file_size = ? WHERE id = ?', [computedSize, row.id]).catch(() => {});
        } catch (e) {}
      }

      return {
        id: row.id,
        url: row.url,
        title: row.title,
        thumbnail: row.thumbnail,
        platform: row.platform,
        format: row.format,
        quality: row.quality,
        status: row.status,
        progress: row.progress,
        speed: row.speed,
        eta: row.eta,
        fileSize: computedSize || null,
        file_size: computedSize || null,
        error: row.error,
        downloadUrl: row.status === 'completed' ? `/api/download-file/${row.id}` : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    res.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch history.' });
  }
}

export async function deleteHistory(req, res) {
  try {
    const { jobId } = req.params;
    
    // Attempt to delete physical file if it exists
    const result = await query('SELECT file_path FROM jobs WHERE id = $1', [jobId]);
    if (result.rows.length > 0 && result.rows[0].file_path) {
      try {
        await fsPromises.unlink(result.rows[0].file_path);
      } catch (e) {
        console.warn(`Failed to delete physical file: ${result.rows[0].file_path}`, e.message);
      }
    }

    await query('DELETE FROM jobs WHERE id = $1', [jobId]);
    res.json({ success: true, message: 'History record deleted' });
  } catch (error) {
    console.error('Delete history error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete history item.' });
  }
}

export async function clearHistory(req, res) {
  try {
    // Attempt to delete all physical files
    const result = await query('SELECT file_path FROM jobs WHERE file_path IS NOT NULL');
    for (const row of result.rows) {
      if (row.file_path) {
        try {
          await fsPromises.unlink(row.file_path);
        } catch (e) {
          // ignore individual file deletion errors
        }
      }
    }

    await query('DELETE FROM jobs');
    res.json({ success: true, message: 'All history cleared' });
  } catch (error) {
    console.error('Clear history error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to clear history.' });
  }
}
