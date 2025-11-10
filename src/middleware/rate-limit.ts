import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { AppError } from '../utils/error-codes';

// Create rate limiter with Redis store
const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string = 'Too many requests'
) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: { code: 'SYS_003', message } },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // @ts-expect-error - RedisStore types are not up to date
      client: redis,
      prefix: 'rl:',
    }),
    handler: (req, res) => {
      throw new AppError('SYS_003', 429);
    },
  });
};

// General API rate limiter
export const apiLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW * 1000,
  env.RATE_LIMIT_MAX_REQUESTS,
  'Too many requests, please try again later'
);

// Authentication endpoints rate limiter (stricter)
export const authLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW * 1000,
  env.RATE_LIMIT_AUTH,
  'Too many login attempts, please try again later'
);

// Transaction endpoints rate limiter
export const transactionLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW * 1000,
  env.RATE_LIMIT_TRANSACTIONS,
  'Too many transaction requests, please try again later'
);

// Admin endpoints rate limiter (more lenient)
export const adminLimiter = createRateLimiter(
  env.RATE_LIMIT_WINDOW * 1000,
  env.RATE_LIMIT_ADMIN,
  'Too many admin requests, please try again later'
);

// File upload rate limiter
export const uploadLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // 5 uploads per minute
  'Too many file uploads, please try again later'
);

export default {
  apiLimiter,
  authLimiter,
  transactionLimiter,
  adminLimiter,
  uploadLimiter,
};
