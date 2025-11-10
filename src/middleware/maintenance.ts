import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AppError } from '../utils/error-codes';

/**
 * Check if app is in maintenance mode
 */
export const checkMaintenance = (req: Request, res: Response, next: NextFunction) => {
  if (env.MAINTENANCE_MODE) {
    // Allow health check endpoint
    if (req.path === '/health') {
      return next();
    }

    throw new AppError('SYS_004', 503);
  }

  next();
};

export default checkMaintenance;
