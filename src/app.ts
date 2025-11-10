import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

import { env } from './config/env';
import { logger, stream } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { checkMaintenance } from './middleware/maintenance';
import { apiLimiter } from './middleware/rate-limit';

// Import routes (we'll create these)
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import transactionRoutes from './routes/transaction.routes';
import kycRoutes from './routes/kyc.routes';
import cardRoutes from './routes/card.routes';
import escrowRoutes from './routes/escrow.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import supportRoutes from './routes/support.routes';
import adminRoutes from './routes/admin.routes';
import webhookRoutes from './routes/webhook.routes';

const app: Application = express();

// ============================================================================
// SENTRY INITIALIZATION (Error Tracking)
// ============================================================================
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 1.0,
  });

  // Sentry request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-2FA-Code', 'X-Request-ID'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev', { stream }));
} else {
  app.use(morgan('combined', { stream }));
}

// Maintenance mode check
app.use(checkMaintenance);

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
      environment: env.NODE_ENV,
    },
  });
});

app.get('/health/ready', async (req, res) => {
  try {
    // Check database
    await import('./config/database').then((db) => db.prisma.$queryRaw`SELECT 1`);

    // Check Redis
    const redis = await import('./config/redis').then((r) => r.default);
    await redis.ping();

    res.json({
      success: true,
      data: {
        status: 'ready',
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SYS_002',
        message: 'Service unavailable',
      },
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

const apiRouter = express.Router();

// Apply general rate limiting to all API routes
apiRouter.use(apiLimiter);

// Public routes (no auth required)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/webhooks', webhookRoutes);

// Protected routes (auth required)
apiRouter.use('/user', userRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/kyc', kycRoutes);
apiRouter.use('/cards', cardRoutes);
apiRouter.use('/escrow', escrowRoutes);
apiRouter.use('/withdrawals', withdrawalRoutes);
apiRouter.use('/support', supportRoutes);

// Admin routes
apiRouter.use('/admin', adminRoutes);

// Mount API router
app.use(`/api/${env.API_VERSION}`, apiRouter);

// ============================================================================
// SWAGGER DOCUMENTATION
// ============================================================================
if (env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Maya Global Pay API',
        version: '1.0.0',
        description:
          'Complete Web3 payment platform with embedded wallets, gasless USDC transactions, cards, escrow, and KYC',
        contact: {
          name: 'Maya Global Pay',
          email: env.SUPPORT_EMAIL,
        },
      },
      servers: [
        {
          url: `${env.BACKEND_URL}/api/${env.API_VERSION}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          BearerAuth: [],
        },
      ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/**/*.ts'],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  logger.info(`Swagger docs available at ${env.BACKEND_URL}/api-docs`);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

// Sentry error handler (must be before other error handlers)
if (env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
