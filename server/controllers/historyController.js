import { query } from '../db/index.js';

export async function getHistory(req, res) {
  try {
    const result = await query(
      'SELECT id, url, title, thumbnail, platform, format, quality, status, progress, created_at, updated_at FROM jobs ORDER BY created_at DESC LIMIT 50'
    );

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        url: row.url,
        title: row.title,
        thumbnail: row.thumbnail,
        platform: row.platform,
        format: row.format,
        quality: row.quality,
        status: row.status,
        progress: row.progress,
        downloadUrl: row.status === 'completed' ? `/api/download-file/${row.id}` : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch history.' });
  }
}

import fs from 'fs/promises';

export async function deleteHistory(req, res) {
  try {
    const { jobId } = req.params;
    
    // Attempt to delete physical file if it exists
    const result = await query('SELECT file_path FROM jobs WHERE id = ?', [jobId]);
    if (result.rows.length > 0 && result.rows[0].file_path) {
      try {
        await fs.unlink(result.rows[0].file_path);
      } catch (err) {
        // Ignore file not found errors
      }
    }
    
    await query('DELETE FROM jobs WHERE id = ?', [jobId]);
    res.json({ success: true, message: 'History item deleted' });
  } catch (error) {
    console.error('Delete history error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete history item.' });
  }
}

export async function clearHistory(req, res) {
  try {
    // Attempt to clear all physical files
    const result = await query('SELECT file_path FROM jobs WHERE file_path IS NOT NULL');
    for (const row of result.rows) {
      if (row.file_path) {
        try {
          await fs.unlink(row.file_path);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    await query('DELETE FROM jobs');
    res.json({ success: true, message: 'All history deleted' });
  } catch (error) {
    console.error('Clear history error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to clear history.' });
  }
}
