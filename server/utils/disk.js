import { statfs } from 'fs/promises';

/**
 * Get available disk space in bytes for a given path.
 * @param {string} targetPath 
 * @returns {Promise<{ freeBytes: number, totalBytes: number }>}
 */
export async function getDiskSpace(targetPath = '.') {
  try {
    const stats = await statfs(targetPath);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    return { freeBytes, totalBytes };
  } catch (error) {
    console.warn('Failed to check disk space via statfs:', error.message);
    return { freeBytes: 100 * 1024 * 1024 * 1024, totalBytes: 500 * 1024 * 1024 * 1024 };
  }
}
