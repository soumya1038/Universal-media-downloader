import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 1000 : config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests, please try again later.',
  },
  skip: (req) => req.path === '/events',
  standardHeaders: true,
  legacyHeaders: false,
});

export const analyzeLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: {
    error: 'Too many analyze requests, please slow down.',
  },
});

export const downloadLimiter = rateLimit({
  windowMs: 60000,
  max: 50,
  message: {
    error: 'Too many download requests, please slow down.',
  },
});
