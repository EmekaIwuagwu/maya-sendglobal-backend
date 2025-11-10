import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    const event = e as { query: string; params: string; duration: number };
    logger.debug(`Query: ${event.query}`);
    logger.debug(`Params: ${event.params}`);
    logger.debug(`Duration: ${event.duration}ms`);
  });
}

// Log database errors
prisma.$on('error' as never, (e: unknown) => {
  const event = e as { message: string; target: string };
  logger.error('Database error:', { message: event.message, target: event.target });
});

// Log database warnings
prisma.$on('warn' as never, (e: unknown) => {
  const event = e as { message: string };
  logger.warn('Database warning:', { message: event.message });
});

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export { prisma };
export default prisma;
