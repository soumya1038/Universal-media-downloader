import { existsSync, createReadStream, statSync } from 'fs';
import path from 'path';
import { query } from '../db/index.js';

export async function downloadFile(req, res) {
  try {
    const { jobId } = req.params;
    const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }

    const job = result.rows[0];

    if (job.status !== 'completed' || !job.file_path) {
      return res.status(400).json({ success: false, error: 'File is not ready for download.' });
    }

    if (!existsSync(job.file_path)) {
      return res.status(404).json({ success: false, error: 'File no longer exists.' });
    }

    const stat = statSync(job.file_path);
    const filename = `${job.title || 'download'}.${job.format || 'mp4'}`;

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    const stream = createReadStream(job.file_path);
    stream.pipe(res);
  } catch (error) {
    console.error('File download error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to download file.' });
  }
}
