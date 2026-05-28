import { isValidUrl } from '../utils/sanitize.js';

export function validateAnalyzeInput(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
  }

  if (url.length > 2048) {
    return res.status(400).json({ error: 'URL is too long.' });
  }

  next();
}

export function validateDownloadInput(req, res, next) {
  const { url, format, quality, sourceUrl } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required.' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  if (sourceUrl && (!isValidUrl(sourceUrl) || typeof sourceUrl !== 'string')) {
    return res.status(400).json({ error: 'Invalid sourceUrl format.' });
  }

  const allowedFormats = ['mp4', 'webm', 'mkv', 'original', 'mp3', 'm4a', 'aac', 'opus', 'wav', 'flac'];
  if (format && !allowedFormats.includes(format)) {
    return res.status(400).json({ error: `Invalid format. Allowed: ${allowedFormats.join(', ')}` });
  }

  const allowedQualities = [
    'best',
    '2160p',
    '1440p',
    '1080p',
    '720p',
    '480p',
    '360p',
    '240p',
    'audio',
    '320k',
    '256k',
    '192k',
    '160k',
    '128k',
    'lossless',
  ];
  if (quality && !allowedQualities.includes(quality)) {
    return res.status(400).json({ error: `Invalid quality. Allowed: ${allowedQualities.join(', ')}` });
  }

  next();
}
