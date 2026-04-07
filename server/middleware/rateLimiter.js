import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const analyzeLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  message: {
    error: 'Too many analyze requests, please slow down.',
  },
});

export const downloadLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: {
    error: 'Too many download requests, please slow down.',
  },
});
