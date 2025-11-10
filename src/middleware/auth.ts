import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/error-codes';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { asyncHandler } from './error-handler';
import { prisma } from '../config/database';
import { AppRole } from '@prisma/client';

/**
 * Authenticate JWT token
 */
export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('AUTH_008', 401);
    }

    const token = authHeader.substring(7);

    try {
      // Verify token
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          walletAddress: true,
          email: true,
          accountStatus: true,
          roles: {
            where: { revokedAt: null },
            select: { role: true },
          },
        },
      });

      if (!user) {
        throw new AppError('USER_001', 404);
      }

      // Check account status
      if (user.accountStatus === 'suspended') {
        throw new AppError('USER_002', 403);
      }

      if (user.accountStatus === 'frozen') {
        throw new AppError('USER_003', 403);
      }

      // Attach user to request
      req.user = {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email || undefined,
        roles: user.roles.map((r) => r.role),
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('AUTH_002', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('AUTH_008', 401);
      }
      throw error;
    }
  }
);

/**
 * Optional authentication (doesn't fail if no token)
 */
export const optionalAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          walletAddress: true,
          email: true,
          accountStatus: true,
          roles: {
            where: { revokedAt: null },
            select: { role: true },
          },
        },
      });

      if (user && user.accountStatus === 'active') {
        req.user = {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email || undefined,
          roles: user.roles.map((r) => r.role),
        };
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  }
);

/**
 * Require specific role
 */
export const requireRole = (...roles: AppRole[]) => {
  return asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const hasRole = roles.some((role) => req.user!.roles.includes(role));

      if (!hasRole) {
        throw new AppError('ADMIN_002', 403);
      }

      next();
    }
  );
};

/**
 * Require admin access
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Require super admin access
 */
export const requireSuperAdmin = requireRole('super_admin');

/**
 * Check if user has KYC approved
 */
export const requireKyc = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('AUTH_003', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { kycStatus: true },
    });

    if (!user) {
      throw new AppError('USER_001', 404);
    }

    if (user.kycStatus !== 'approved') {
      if (user.kycStatus === 'pending' || user.kycStatus === 'submitted') {
        throw new AppError('USER_005', 403);
      }
      throw new AppError('USER_004', 403);
    }

    next();
  }
);

/**
 * Check if user email is verified
 */
export const requireEmailVerified = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('AUTH_003', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user) {
      throw new AppError('USER_001', 404);
    }

    if (!user.emailVerified) {
      throw new AppError('USER_006', 403);
    }

    next();
  }
);

/**
 * Verify 2FA token
 */
export const verify2FA = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('AUTH_003', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { twoFactorEnabled: true },
    });

    if (user?.twoFactorEnabled) {
      const twoFactorCode = req.headers['x-2fa-code'] as string;

      if (!twoFactorCode) {
        throw new AppError('AUTH_005', 401);
      }

      // TODO: Implement actual 2FA verification
      // This would use speakeasy or otplib to verify the code
    }

    next();
  }
);

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
  requireKyc,
  requireEmailVerified,
  verify2FA,
};
