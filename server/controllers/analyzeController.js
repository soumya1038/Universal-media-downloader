import { analyzeUrl, detectPlatform } from '../services/ytdlpService.js';

export async function analyze(req, res) {
  try {
    const { url } = req.body;
    const metadata = await analyzeUrl(url);

    res.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error('Analyze error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze URL.',
    });
  }
}
