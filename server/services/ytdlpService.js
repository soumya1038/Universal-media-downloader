import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { spotifyToYouTube } from './spotifyService.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths to our local binaries, fallback to global commands
const binDir = path.resolve(__dirname, '..', 'bin');
let ytdlpPath = process.platform === 'win32' ? path.join(binDir, 'yt-dlp.exe') : path.join(binDir, 'yt-dlp');
let ffmpegPath = process.platform === 'win32' ? path.join(binDir, 'ffmpeg.exe') : path.join(binDir, 'ffmpeg');

if (!existsSync(ytdlpPath)) ytdlpPath = 'yt-dlp';
if (!existsSync(ffmpegPath)) ffmpegPath = 'ffmpeg';

const AUDIO_FORMATS = new Set(['mp3', 'm4a', 'aac', 'opus', 'wav', 'flac']);

const DRM_PLATFORM_INFO = {
  'apple-music': {
    displayName: 'Apple Music',
    guidance: 'Use Apple Music official offline download inside the Apple Music app.',
  },
  netflix: {
    displayName: 'Netflix',
    guidance: 'Use Netflix official offline download inside the Netflix app.',
  },
  hulu: {
    displayName: 'Hulu',
    guidance: 'Use Hulu official offline download where available in the Hulu app.',
  },
  'disney+': {
    displayName: 'Disney+',
    guidance: 'Use Disney+ official offline download inside the Disney+ app.',
  },
};

const VIDEO_BITRATE_HINTS = {
  '2160p': 18000,
  '1440p': 9000,
  '1080p': 5000,
  '720p': 2500,
  '480p': 1200,
  '360p': 700,
  '240p': 400,
};

const AUDIO_PROFILE_HINTS = {
  '320k': 320,
  '256k': 256,
  '192k': 192,
  '160k': 160,
  '128k': 128,
  lossless: 900,
};

function toPositiveInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null;
}

function estimateBytesFromBitrateKbps(kbps, durationSeconds) {
  const safeDuration = toPositiveInt(durationSeconds);
  const safeKbps = toPositiveInt(kbps);
  if (!safeDuration || !safeKbps) return null;
  return Math.floor((safeKbps * 1000 * safeDuration) / 8);
}

function createEstimate({ durationSeconds, knownSizeBytes, bitrateKbps, transcoding = false }) {
  const inferredSize = toPositiveInt(knownSizeBytes) || estimateBytesFromBitrateKbps(bitrateKbps, durationSeconds);
  if (!inferredSize) {
    return {
      internetBytes: null,
      storageBytes: null,
      workingSpaceBytes: null,
    };
  }

  // Network overhead and temporary working space while remuxing/converting.
  const internetMultiplier = transcoding ? 1.15 : 1.06;
  const workingMultiplier = transcoding ? 1.65 : 1.25;

  return {
    internetBytes: Math.floor(inferredSize * internetMultiplier),
    storageBytes: inferredSize,
    workingSpaceBytes: Math.floor(inferredSize * workingMultiplier),
  };
}

function pickBestVideoFormats(rawFormats = []) {
  const perResolution = new Map();

  for (const format of rawFormats) {
    if (!format || !format.height || !format.vcodec || format.vcodec === 'none') continue;

    const height = toPositiveInt(format.height);
    if (!height) continue;

    const current = perResolution.get(height);
    const bitrate = toPositiveInt(format.tbr) || toPositiveInt(format.vbr) || 0;
    const fileSize = toPositiveInt(format.filesize) || toPositiveInt(format.filesize_approx) || null;

    const score =
      (fileSize ? 1_000_000 : 0) +
      (format.ext === 'mp4' ? 200_000 : 0) +
      (format.ext === 'webm' ? 100_000 : 0) +
      bitrate;

    if (!current || score > current.score) {
      perResolution.set(height, {
        score,
        formatId: format.format_id,
        ext: format.ext || 'mp4',
        resolution: `${height}p`,
        height,
        filesize: fileSize,
      });
    }
  }

  return [...perResolution.values()]
    .map(({ score, ...format }) => format)
    .sort((a, b) => b.height - a.height);
}

function toLegacyFormats(videoFormats, durationSeconds) {
  const formats = videoFormats.map((video) => ({
    formatId: video.formatId,
    ext: video.ext || 'mp4',
    resolution: video.resolution,
    height: video.height,
    type: 'video',
    filesize: video.filesize || null,
  }));

  const audioEstimate = createEstimate({
    durationSeconds,
    bitrateKbps: 192,
    transcoding: true,
  });

  formats.push({
    formatId: 'audio',
    ext: 'mp3',
    resolution: 'audio',
    height: 0,
    type: 'audio',
    filesize: audioEstimate.storageBytes,
  });

  return formats;
}

function addEstimateToOption(option, estimate) {
  return {
    ...option,
    estimatedInternetBytes: estimate.internetBytes,
    estimatedStorageBytes: estimate.storageBytes,
    estimatedWorkingSpaceBytes: estimate.workingSpaceBytes,
  };
}

function buildDownloadOptions({ videoFormats, durationSeconds, sourceUrl, downloadMethod }) {
  const options = [];

  if (videoFormats.length > 0) {
    const bestVideo = videoFormats[0];
    const bestEstimate = createEstimate({
      durationSeconds,
      knownSizeBytes: bestVideo.filesize,
      bitrateKbps: VIDEO_BITRATE_HINTS[bestVideo.resolution] || bestVideo.height * 3,
      transcoding: false,
    });

    options.push(
      addEstimateToOption(
        {
          id: 'video-original-best',
          label: 'Original Best (Source)',
          format: 'original',
          quality: 'best',
          type: 'video',
          formatId: 'bestvideo*+bestaudio/best',
          sourceUrl,
          downloadMethod,
          description: 'Keeps source container/codecs whenever possible.',
          filesize: bestVideo.filesize || null,
        },
        bestEstimate
      )
    );

    for (const video of videoFormats.slice(0, 8)) {
      const bitrateHint = VIDEO_BITRATE_HINTS[video.resolution] || Math.max(video.height * 3, 500);
      const estimate = createEstimate({
        durationSeconds,
        knownSizeBytes: video.filesize,
        bitrateKbps: bitrateHint,
        transcoding: video.ext !== 'mp4',
      });

      options.push(
        addEstimateToOption(
          {
            id: `mp4-${video.resolution}`,
            label: `MP4 ${video.resolution}`,
            format: 'mp4',
            quality: video.resolution,
            type: 'video',
            formatId: video.formatId,
            sourceUrl,
            downloadMethod,
            description: 'Best compatibility across phones, browsers, and TVs.',
            filesize: video.filesize || null,
          },
          estimate
        )
      );
    }

    const webmTarget = videoFormats.find((video) => video.ext === 'webm') || bestVideo;
    const webmEstimate = createEstimate({
      durationSeconds,
      knownSizeBytes: webmTarget.filesize,
      bitrateKbps: VIDEO_BITRATE_HINTS[webmTarget.resolution] || 2000,
      transcoding: false,
    });

    options.push(
      addEstimateToOption(
        {
          id: `webm-${webmTarget.resolution}`,
          label: `WEBM ${webmTarget.resolution}`,
          format: 'webm',
          quality: webmTarget.resolution,
          type: 'video',
          formatId: webmTarget.formatId,
          sourceUrl,
          downloadMethod,
          description: 'Efficient size for modern browsers and Android.',
          filesize: webmTarget.filesize || null,
        },
        webmEstimate
      )
    );

    const mkvEstimate = createEstimate({
      durationSeconds,
      knownSizeBytes: bestVideo.filesize,
      bitrateKbps: VIDEO_BITRATE_HINTS[bestVideo.resolution] || 3000,
      transcoding: false,
    });

    options.push(
      addEstimateToOption(
        {
          id: 'mkv-best',
          label: 'MKV Best Quality',
          format: 'mkv',
          quality: 'best',
          type: 'video',
          formatId: 'bestvideo*+bestaudio/best',
          sourceUrl,
          downloadMethod,
          description: 'Maximum quality container for archival workflows.',
          filesize: bestVideo.filesize || null,
        },
        mkvEstimate
      )
    );
  }

  const audioProfiles = [
    { id: 'mp3-320k', label: 'MP3 320k', format: 'mp3', quality: '320k', description: 'Highest MP3 quality.' },
    { id: 'mp3-192k', label: 'MP3 192k', format: 'mp3', quality: '192k', description: 'Balanced quality and size.' },
    { id: 'm4a-256k', label: 'M4A 256k', format: 'm4a', quality: '256k', description: 'Great for Apple ecosystem.' },
    { id: 'opus-160k', label: 'OPUS 160k', format: 'opus', quality: '160k', description: 'Efficient at lower data usage.' },
    { id: 'flac-lossless', label: 'FLAC Lossless', format: 'flac', quality: 'lossless', description: 'Lossless archive audio.' },
  ];

  for (const profile of audioProfiles) {
    const estimate = createEstimate({
      durationSeconds,
      bitrateKbps: AUDIO_PROFILE_HINTS[profile.quality] || 192,
      transcoding: true,
    });

    options.push(
      addEstimateToOption(
        {
          ...profile,
          type: 'audio',
          formatId: 'bestaudio',
          sourceUrl,
          downloadMethod,
          filesize: estimate.storageBytes,
        },
        estimate
      )
    );
  }

  // Remove duplicates while preserving order.
  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.id)) return false;
    seen.add(option.id);
    return true;
  });
}

async function fetchMetadata(url) {
  const { stdout } = await execFileAsync(
    ytdlpPath,
    [
      '--dump-json',
      '--no-download',
      '--no-warnings',
      '--no-playlist',
      '--extractor-args',
      'youtube:player_client=android',
      '--ffmpeg-location',
      ffmpegPath,
      url,
    ],
    { timeout: 35000 }
  );

  return JSON.parse(stdout);
}

function buildChecks(url, platform) {
  return {
    originalUrl: url,
    platform,
    drmProtected: isDrmPlatform(platform),
    method: isDrmPlatform(platform)
      ? 'blocked-drm'
      : platform === 'spotify'
        ? 'spotify-youtube-search'
        : 'direct-yt-dlp',
  };
}

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

export function isDrmPlatform(platform) {
  return Boolean(DRM_PLATFORM_INFO[platform]);
}

export function getDrmPlatformInfo(platform) {
  return DRM_PLATFORM_INFO[platform] || null;
}

/**
 * Analyze a URL and return metadata using yt-dlp --dump-json.
 */
export async function analyzeUrl(url) {
  const platform = detectPlatform(url);
  const checks = buildChecks(url, platform);

  if (isDrmPlatform(platform)) {
    const drmInfo = getDrmPlatformInfo(platform);
    return {
      title: `${drmInfo?.displayName || platform} (DRM Protected)`,
      thumbnail: null,
      duration: 'Unknown',
      durationSeconds: 0,
      platform,
      author: 'Restricted',
      formats: [],
      downloadOptions: [],
      checks: {
        ...checks,
        blockedReason: `${drmInfo?.displayName || platform} is DRM protected.`,
      },
      downloadBlocked: true,
      notices: [
        `${drmInfo?.displayName || platform} is DRM protected. This app does not bypass DRM.`,
        drmInfo?.guidance || 'Use the official app for offline access.',
      ],
    };
  }

  // Spotify is metadata + YouTube search workflow.
  if (platform === 'spotify') {
    try {
      const spotifyMatch = await spotifyToYouTube(url);
      const youtubeData = await fetchMetadata(spotifyMatch.youtubeUrl);
      const videoFormats = pickBestVideoFormats(youtubeData.formats || []);
      const durationSeconds = youtubeData.duration || spotifyMatch.duration || 0;

      return {
        title: `${spotifyMatch.spotifyArtist} - ${spotifyMatch.spotifyTitle}`,
        thumbnail: spotifyMatch.thumbnail || youtubeData.thumbnail || null,
        duration: durationSeconds ? formatDuration(durationSeconds) : 'Unknown',
        durationSeconds,
        platform: 'spotify',
        author: spotifyMatch.spotifyArtist || youtubeData.uploader || youtubeData.channel || 'Unknown',
        sourceUrl: spotifyMatch.youtubeUrl,
        formats: toLegacyFormats(videoFormats, durationSeconds),
        downloadOptions: buildDownloadOptions({
          videoFormats,
          durationSeconds,
          sourceUrl: spotifyMatch.youtubeUrl,
          downloadMethod: 'spotify-youtube-search',
        }),
        checks,
        notices: [
          'Spotify links are resolved via song metadata and downloaded from the best matching YouTube source.',
        ],
      };
    } catch (error) {
      throw new Error(`Spotify track lookup failed: ${error.message}`);
    }
  }

  try {
    const data = await fetchMetadata(url);
    const durationSeconds = toPositiveInt(data.duration) || 0;
    const videoFormats = pickBestVideoFormats(data.formats || []);
    const formats = toLegacyFormats(videoFormats, durationSeconds);
    const downloadOptions = buildDownloadOptions({
      videoFormats,
      durationSeconds,
      sourceUrl: url,
      downloadMethod: 'direct-yt-dlp',
    });

    return {
      title: data.title || 'Unknown',
      thumbnail: data.thumbnail || null,
      duration: durationSeconds ? formatDuration(durationSeconds) : 'Unknown',
      durationSeconds,
      platform,
      author: data.uploader || data.channel || 'Unknown',
      formats,
      downloadOptions,
      checks,
      downloadBlocked: false,
      notices: [],
    };
  } catch (error) {
    // Better error messages for common issues
    const errMsg = error.message || '';
    
    if (errMsg.includes('DRM')) {
      throw new Error('This content is DRM protected and cannot be downloaded here. Use the official app for offline access.');
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
export async function downloadMedia(inputUrl, outputTemplate, options = {}) {
  const {
    format = 'mp4',
    quality = '720p',
    formatId,
    signal,
    downloadMethod,
    sourceUrl,
    onProgress,
  } = options;

  const sourcePlatform = detectPlatform(inputUrl);
  if (isDrmPlatform(sourcePlatform)) {
    const drmInfo = getDrmPlatformInfo(sourcePlatform);
    throw new Error(
      `${drmInfo?.displayName || sourcePlatform} is DRM protected and cannot be downloaded. ${drmInfo?.guidance || ''}`.trim()
    );
  }

  let effectiveUrl = sourceUrl || inputUrl;

  // Spotify never provides direct media binaries; we resolve it to YouTube.
  if ((downloadMethod === 'spotify-youtube-search' || sourcePlatform === 'spotify') && !sourceUrl) {
    const mapped = await spotifyToYouTube(inputUrl);
    effectiveUrl = mapped.youtubeUrl;
  }

  const effectivePlatform = detectPlatform(effectiveUrl);
  if (isDrmPlatform(effectivePlatform)) {
    const drmInfo = getDrmPlatformInfo(effectivePlatform);
    throw new Error(
      `${drmInfo?.displayName || effectivePlatform} is DRM protected and cannot be downloaded. ${drmInfo?.guidance || ''}`.trim()
    );
  }

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--extractor-args', 'youtube:player_client=android',
    '--ffmpeg-location', ffmpegPath,
    '-o', outputTemplate,
  ];

  const wantsAudio = AUDIO_FORMATS.has(format) || quality === 'audio';

  if (wantsAudio) {
    const audioFormat = AUDIO_FORMATS.has(format) ? format : 'mp3';

    args.push('-x', '--audio-format', audioFormat, '--add-metadata', '--embed-thumbnail');

    if (quality && /^\d+k$/i.test(quality)) {
      const kbps = parseInt(quality, 10);
      if (Number.isFinite(kbps) && kbps > 0) {
        args.push('--audio-quality', `${kbps}K`);
      }
    } else if (audioFormat === 'mp3') {
      args.push('--audio-quality', '0');
    }
  } else if (format === 'original') {
    args.push('-f', formatId || 'bestvideo*+bestaudio/best');
  } else if (formatId) {
    const selector = formatId.includes('+')
      ? formatId
      : `${formatId}+bestaudio[ext=m4a]/${formatId}+bestaudio/${formatId}/bestvideo+bestaudio/best`;

    args.push('-f', selector, '--merge-output-format', format || 'mp4');
  } else if (quality === 'best') {
    args.push('-f', 'bestvideo*+bestaudio/best', '--merge-output-format', format || 'mp4');
  } else if (quality) {
    const height = parseInt(String(quality).replace('p', ''), 10);
    if (Number.isFinite(height) && height > 0) {
      args.push(
        '-f',
        `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/bestvideo+bestaudio/best`,
        '--merge-output-format',
        format || 'mp4'
      );
    } else {
      args.push('-f', 'bestvideo*+bestaudio/best', '--merge-output-format', format || 'mp4');
    }
  } else {
    args.push('-f', 'best', '--merge-output-format', format || 'mp4');
  }

  args.push(effectiveUrl);

  return new Promise((resolve, reject) => {
    try {
      const child = spawn(ytdlpPath, args, { signal });

      child.stdout.on('data', (data) => {
        const output = data.toString();
        
        if (onProgress) {
          const lines = output.split('\n');
          for (const line of lines) {
             if (line.includes('[download]') && line.includes('%')) {
               const percentMatch = line.match(/(\d+\.?\d*)%/);
               const speedMatch = line.match(/at\s+([^\s]+)/);
               const downloadedMatch = line.match(/of\s+[~]?([^\s]+)/) || line.match(/(\d+\.?\d*[a-zA-Z]+)\s+at/);
               
               if (percentMatch) {
                 const progressObj = {
                   percent: parseFloat(percentMatch[1]),
                   speed: speedMatch ? speedMatch[1] : null,
                   downloaded: downloadedMatch ? downloadedMatch[1] : null
                 };
                 onProgress(progressObj);
               }
             }
          }
        }
      });

      child.stderr.on('data', (data) => {
        // Warning output usually harmless
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`yt-dlp exited with code ${code}`));
      });

      child.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(new Error(`Download failed: ${error.message}`));
    }
  });
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
