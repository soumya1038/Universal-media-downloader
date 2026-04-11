import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths to our local binaries, fallback to global commands
const binDir = path.resolve(__dirname, '..', 'bin');
let ytdlpPath = process.platform === 'win32' ? path.join(binDir, 'yt-dlp.exe') : path.join(binDir, 'yt-dlp');
let ffmpegPath = process.platform === 'win32' ? path.join(binDir, 'ffmpeg.exe') : path.join(binDir, 'ffmpeg');

if (!existsSync(ytdlpPath)) ytdlpPath = 'yt-dlp';
if (!existsSync(ffmpegPath)) ffmpegPath = 'ffmpeg';

/**
 * Detect which platform a URL belongs to.
 */
export function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'x';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('spotify.com')) return 'spotify';
  if (lower.includes('apple.com/music') || lower.includes('music.apple.com')) return 'apple-music';
  if (lower.includes('netflix.com')) return 'netflix';
  if (lower.includes('hulu.com')) return 'hulu';
  if (lower.includes('disneyplus.com') || lower.includes('disney+')) return 'disney+';
  return 'direct';
}

/**
 * Analyze a URL and return metadata using yt-dlp --dump-json.
 */
export async function analyzeUrl(url) {
  // Check for DRM-protected platforms upfront
  const platform = detectPlatform(url);
  const drmPlatforms = ['spotify', 'apple-music', 'netflix', 'hulu', 'disney+'];
  
  if (drmPlatforms.includes(platform)) {
    throw new Error(`${platform.charAt(0).toUpperCase() + platform.slice(1)} uses DRM protection and cannot be downloaded. This platform encrypts content to prevent downloading. Please use the official ${platform} app to listen/watch offline.`);
  }

  try {
    const { stdout } = await execFileAsync(ytdlpPath, [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android',
      '--ffmpeg-location', ffmpegPath,
      url,
    ], { timeout: 30000 });

    const data = JSON.parse(stdout);

    // Extract available formats
    const formats = [];
    const seenResolutions = new Set();

    if (data.formats) {
      for (const f of data.formats) {
        if (f.vcodec && f.vcodec !== 'none' && f.height) {
          const key = `${f.height}p`;
          if (!seenResolutions.has(key)) {
            seenResolutions.add(key);

            let size = f.filesize || f.filesize_approx;
            if (!size && data.duration) {
              const vBitrate = f.vbr || f.tbr || 0;
              if (vBitrate > 0) {
                // Add 128kbps to account for the audio track being merged
                size = Math.floor((vBitrate + 128) * 125 * data.duration);
              }
            }

            formats.push({
              formatId: f.format_id,
              ext: f.ext || 'mp4',
              resolution: key,
              height: f.height,
              type: 'video',
              filesize: size || null,
            });
          }
        }
      }
    }

    // Sort by resolution descending
    formats.sort((a, b) => b.height - a.height);

    // Add audio-only option
    formats.push({
      formatId: 'audio',
      ext: 'mp3',
      resolution: 'audio',
      height: 0,
      type: 'audio',
      filesize: data.duration ? Math.floor(192 * 125 * data.duration) : null,
    });

    return {
      title: data.title || 'Unknown',
      thumbnail: data.thumbnail || null,
      duration: data.duration ? formatDuration(data.duration) : 'Unknown',
      durationSeconds: data.duration || 0,
      platform,
      author: data.uploader || data.channel || 'Unknown',
      formats,
    };
  } catch (error) {
    // Better error messages for common issues
    const errMsg = error.message || '';
    
    if (errMsg.includes('DRM')) {
      throw new Error('This content is DRM-protected and cannot be downloaded. Please use the official app for offline access.');
    }
    if (errMsg.includes('Sign in') || errMsg.includes('not a bot')) {
      throw new Error('Platform requires authentication. Please try a different video or check if the video is public.');
    }
    if (errMsg.includes('Video unavailable') || errMsg.includes('Private video')) {
      throw new Error('Video is unavailable, private, or has been removed.');
    }
    if (errMsg.includes('Unsupported URL')) {
      throw new Error('This URL is not supported. Supported platforms: YouTube, Instagram, Facebook, X (Twitter), TikTok, and direct video URLs.');
    }
    
    throw new Error(`Failed to analyze URL: ${error.message}`);
  }
}

/**
 * Download media using yt-dlp.
 */
export async function downloadMedia(url, outputPath, format, quality, formatId, signal) {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--extractor-args', 'youtube:player_client=android',
    '--ffmpeg-location', ffmpegPath,
    '-o', outputPath,
  ];

  if (format === 'mp3' || quality === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (formatId) {
    args.push(
      '-f', `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/${formatId}/best`,
      '--merge-output-format', format || 'mp4'
    );
  } else if (quality) {
    const height = parseInt(quality.replace('p', ''), 10);
    args.push(
      '-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`,
      '--merge-output-format', format || 'mp4'
    );
  } else {
    args.push('-f', 'best', '--merge-output-format', format || 'mp4');
  }

  args.push(url);

  try {
    const options = { timeout: 600000 };
    if (signal) options.signal = signal;
    await execFileAsync(ytdlpPath, args, options);
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
