import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });


const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'sqlite://./storage/database.sqlite',
  },


  storage: {
    downloadPath: process.env.STORAGE_PATH || './storage/downloads',
    tempPath: process.env.TEMP_PATH || './storage/temp',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  limits: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '2048', 10),
    maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3', 10),
    fileRetentionHours: parseInt(process.env.FILE_RETENTION_HOURS || '24', 10),
  },
};

export default config;
