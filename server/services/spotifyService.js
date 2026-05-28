import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import https from 'https';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const binDir = path.resolve(__dirname, '..', 'bin');
let ytdlpPath = process.platform === 'win32' ? path.join(binDir, 'yt-dlp.exe') : path.join(binDir, 'yt-dlp');
let ffmpegPath = process.platform === 'win32' ? path.join(binDir, 'ffmpeg.exe') : path.join(binDir, 'ffmpeg');

if (!existsSync(ytdlpPath)) ytdlpPath = 'yt-dlp';
if (!existsSync(ffmpegPath)) ffmpegPath = 'ffmpeg';

function fetchSpotifyHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export async function spotifyToYouTube(spotifyUrl) {
  try {
    const html = await fetchSpotifyHtml(spotifyUrl);
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let titleText = titleMatch ? titleMatch[1] : '';
    titleText = titleText.replace(/\| Spotify$/, '').trim();
    
    // Parse "Song - song and lyrics by Artist"
    const parts = titleText.split('- song and lyrics by');
    let title = parts[0] ? parts[0].trim() : '';
    let artist = parts[1] ? parts[1].trim() : '';

    if (!title && titleText) {
      const basicParts = titleText.split('-');
      title = basicParts[0] ? basicParts[0].trim() : titleText;
      artist = basicParts[1] ? basicParts[1].trim() : '';
    }

    const searchQuery = `${artist} - ${title}`.trim();

    if (!searchQuery || searchQuery === '-') {
      throw new Error('Could not extract song information from Spotify URL');
    }
    
    const thumbMatch = html.match(/<meta property="og:image" content="(.*?)"/i);
    const thumbnail = thumbMatch ? thumbMatch[1] : null;

    // Search YouTube for the song
    const { stdout: searchResults } = await execFileAsync(ytdlpPath, [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--default-search', 'ytsearch1',
      '--extractor-args', 'youtube:player_client=android',
      `ytsearch1:${searchQuery}`,
    ], { timeout: 15000 });

    const youtubeData = JSON.parse(searchResults);
    
    return {
      spotifyTitle: title,
      spotifyArtist: artist,
      youtubeUrl: youtubeData.webpage_url || youtubeData.url,
      youtubeTitle: youtubeData.title,
      thumbnail: thumbnail || youtubeData.thumbnail,
      duration: youtubeData.duration,
    };
  } catch (error) {
    throw new Error(`Failed to find YouTube equivalent: ${error.message}`);
  }
}

/**
 * Download from Spotify by finding it on YouTube
 */
export async function downloadSpotifyTrack(spotifyUrl, outputPath, signal) {
  try {
    // First, find the YouTube equivalent
    const { youtubeUrl, spotifyTitle, spotifyArtist } = await spotifyToYouTube(spotifyUrl);

    // Download from YouTube as MP3
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--extractor-args', 'youtube:player_client=android',
      '--ffmpeg-location', ffmpegPath,
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--embed-thumbnail',
      '--add-metadata',
      '-o', outputPath,
      youtubeUrl,
    ];

    const options = { timeout: 600000 };
    if (signal) options.signal = signal;
    
    await execFileAsync(ytdlpPath, args, options);

    return {
      success: true,
      source: 'youtube',
      originalTitle: spotifyTitle,
      originalArtist: spotifyArtist,
    };
  } catch (error) {
    throw new Error(`Failed to download Spotify track: ${error.message}`);
  }
}
