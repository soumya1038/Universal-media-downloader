import { spawn } from 'child_process';
import path from 'path';
import config from '../config/index.js';

export async function updateYtdlp(req, res) {
  const ytdlpPath = config.ytdlp.path;

  return new Promise((resolve) => {
    try {
      const child = spawn(ytdlpPath, ['-U']);
      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        const isSuccess = code === 0 || output.includes('up to date') || output.includes('Updated');
        res.json({
          success: isSuccess,
          message: output.trim() || (isSuccess ? 'yt-dlp is up to date' : 'Update failed'),
          code,
        });
        resolve();
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
      resolve();
    }
  });
}
