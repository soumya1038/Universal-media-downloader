import { query } from '../db/index.js';

export async function getJobStatus(req, res) {
  try {
    const { jobId } = req.params;
    const result = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }

    const job = result.rows[0];

    res.json({
      success: true,
      data: {
        id: job.id,
        url: job.url,
        title: job.title,
        thumbnail: job.thumbnail,
        platform: job.platform,
        format: job.format,
        quality: job.quality,
        status: job.status,
        progress: job.progress,
        fileSize: job.file_size,
        format: job.format,
        downloadUrl: job.status === 'completed' ? `/api/download-file/${job.id}` : null,
        error: job.error,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      },
    });
  } catch (error) {
    console.error('Job status error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch job status.' });
  }
}
