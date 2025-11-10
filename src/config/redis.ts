import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

const redisConfig = {
  ...(() => {
    const url = new URL(env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: env.REDIS_PASSWORD || url.password || undefined,
    };
  })(),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  ...(env.REDIS_TLS && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
};

// Create Redis client
export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

export default redis;
