/**
 * Sanitize a filename to prevent path traversal and command injection.
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[^\w\s.-]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200);
}

/**
 * Validate a URL string.
 */
export function isValidUrl(str) {
  try {
    const url = new URL(str);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Supported platforms list.
 */
export const SUPPORTED_PLATFORMS = [
  'youtube.com', 'youtu.be',
  'instagram.com',
  'facebook.com', 'fb.watch',
  'twitter.com', 'x.com',
  'tiktok.com',
];

/**
 * Check if URL is from a supported platform or is a direct URL.
 */
export function isSupportedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    return SUPPORTED_PLATFORMS.some(p => host.includes(p)) || true; // allow direct URLs too
  } catch {
    return false;
  }
}
