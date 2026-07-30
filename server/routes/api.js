import { Router } from 'express';
import { analyze } from '../controllers/analyzeController.js';
import { startDownload, cancelDownload } from '../controllers/downloadController.js';
import { getJobStatus } from '../controllers/jobController.js';
import { getHistory, deleteHistory, clearHistory } from '../controllers/historyController.js';
import { downloadFile } from '../controllers/fileController.js';
import { validateAnalyzeInput, validateDownloadInput } from '../middleware/validator.js';
import { analyzeLimiter, downloadLimiter } from '../middleware/rateLimiter.js';
import { handleEvents } from '../controllers/eventController.js';
import { updateYtdlp } from '../controllers/systemController.js';

const router = Router();

// Real-time SSE streaming events endpoint
router.get('/events', handleEvents);

// System yt-dlp binary auto-updater endpoint
router.get('/system/update-ytdlp', updateYtdlp);

// Analyze a media URL
router.post('/analyze', analyzeLimiter, validateAnalyzeInput, analyze);

// Start a download job
router.post('/download', downloadLimiter, validateDownloadInput, startDownload);

// Cancel a download job
router.delete('/cancel/:jobId', cancelDownload);

// Get job status
router.get('/job/:jobId', getJobStatus);

// Get download history
router.get('/history', getHistory);

// Clear all download history
router.delete('/history', clearHistory);

// Delete specific download history item
router.delete('/history/:jobId', deleteHistory);

// Download completed file
router.get('/download-file/:jobId', downloadFile);

export default router;
