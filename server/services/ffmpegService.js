import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Convert video to a specific format using FFmpeg.
 */
export async function convertFormat(inputPath, outputPath, format) {
  const args = ['-i', inputPath, '-y'];

  switch (format) {
    case 'mp4':
      args.push('-c:v', 'libx264', '-c:a', 'aac', '-movflags', '+faststart');
      break;
    case 'webm':
      args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
      break;
    case 'mp3':
      args.push('-vn', '-ab', '320k', '-ar', '44100');
      break;
    default:
      args.push('-c', 'copy');
  }

  args.push(outputPath);

  try {
    await execFileAsync('ffmpeg', args, { timeout: 600000 });
  } catch (error) {
    throw new Error(`FFmpeg conversion failed: ${error.message}`);
  }
}

/**
 * Extract audio from a video file.
 */
export async function extractAudio(inputPath, outputPath) {
  try {
    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-vn',
      '-ab', '320k',
      '-ar', '44100',
      '-y',
      outputPath,
    ], { timeout: 300000 });
  } catch (error) {
    throw new Error(`Audio extraction failed: ${error.message}`);
  }
}

/**
 * Resize video to a specific resolution.
 */
export async function resizeVideo(inputPath, outputPath, height) {
  try {
    await execFileAsync('ffmpeg', [
      '-i', inputPath,
      '-vf', `scale=-2:${height}`,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-movflags', '+faststart',
      '-y',
      outputPath,
    ], { timeout: 600000 });
  } catch (error) {
    throw new Error(`Video resize failed: ${error.message}`);
  }
}
