import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

const PORT = env.PORT || 3000;

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, closing server gracefully...`);

  try {
    // Close database connection
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Close Redis connection
    await redis.quit();
    logger.info('Redis connection closed');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🚀 Maya Global Pay Backend Server Started 🚀          ║
║                                                               ║
║  Environment: ${env.NODE_ENV.padEnd(47)} ║
║  Port:        ${String(PORT).padEnd(47)} ║
║  API Version: ${env.API_VERSION.padEnd(47)} ║
║  URL:         ${env.BACKEND_URL.padEnd(47)} ║
║                                                               ║
║  📚 API Docs: ${(env.BACKEND_URL + '/api-docs').padEnd(47)} ║
║  ❤️  Health:   ${(env.BACKEND_URL + '/health').padEnd(47)} ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Increase timeout for long-running requests
    server.timeout = 120000; // 2 minutes

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
