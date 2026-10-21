import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
});

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later',
  },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: config.rateLimit.otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many OTP requests, please wait before retrying',
  },
});
