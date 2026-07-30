import { analyzeUrl } from '../services/ytdlpService.js';

export async function analyze(req, res) {
  try {
    const { url } = req.body;
    const metadata = await analyzeUrl(url);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    const message = error?.message || String(error) || 'Failed to analyze URL.';
    console.error('Analyze error:', message);
    const statusCode = message.includes('timed out') ? 504 : 400;
    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
}

