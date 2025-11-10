import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/error-codes';
import { ApiResponse } from '../types';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Operational errors (expected)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.data,
      },
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SYS_007',
        message: 'Validation error',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'SYS_006',
          message: 'Resource already exists',
          details: err.meta,
        },
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SYS_006',
          message: 'Resource not found',
        },
      });
    }

    // Foreign key constraint violation
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SYS_006',
          message: 'Invalid reference',
          details: err.meta,
        },
      });
    }
  }

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SYS_007',
        message: 'Invalid data provided',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_008',
        message: 'Invalid or missing token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_002',
        message: 'Token expired',
      },
    });
  }

  // Default to 500 internal server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'SYS_001',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'SYS_006',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;
