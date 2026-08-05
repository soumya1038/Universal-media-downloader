import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim())
  : '*';

app.use(cors({
  origin: allowedOrigins === '*' ? true : allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
