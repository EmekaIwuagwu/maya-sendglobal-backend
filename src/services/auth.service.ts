import jwt from 'jsonwebtoken';
import { User, AppRole } from '@prisma/client';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/error-codes';
import { JwtPayload, RefreshTokenPayload } from '../types';
import { logger } from '../config/logger';

export class AuthService {
  /**
   * Generate access token
   */
  static generateAccessToken(userId: string, walletAddress: string, roles: AppRole[]): string {
    const payload: JwtPayload = {
      userId,
      walletAddress,
      roles,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string, tokenVersion: number = 0): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenVersion,
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('AUTH_002', 401);
      }
      throw new AppError('AUTH_008', 401);
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('AUTH_009', 401);
      }
      throw new AppError('AUTH_008', 401);
    }
  }

  /**
   * Create or update user from Web3Auth
   */
  static async createOrUpdateUser(data: {
    web3authId: string;
    walletAddress: string;
    email?: string;
    name?: string;
  }) {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { web3authId: data.web3authId },
        include: {
          roles: {
            where: { revokedAt: null },
            select: { role: true },
          },
          wallets: true,
        },
      });

      if (user) {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            email: data.email || user.email,
            fullName: data.name || user.fullName,
          },
          include: {
            roles: {
              where: { revokedAt: null },
              select: { role: true },
            },
            wallets: true,
          },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            web3authId: data.web3authId,
            walletAddress: data.walletAddress,
            email: data.email,
            fullName: data.name,
            lastLoginAt: new Date(),
            roles: {
              create: {
                role: 'user',
              },
            },
            wallets: {
              create: {
                walletAddress: data.walletAddress,
                walletType: 'embedded',
                chain: 'base',
                network: env.DEFAULT_NETWORK,
                isPrimary: true,
              },
            },
          },
          include: {
            roles: {
              where: { revokedAt: null },
              select: { role: true },
            },
            wallets: true,
          },
        });

        logger.info(`New user created: ${user.id}`);
      }

      return user;
    } catch (error) {
      logger.error('Error creating/updating user:', error);
      throw new AppError('AUTH_004', 500);
    }
  }

  /**
   * Get user with roles
   */
  static async getUserWithRoles(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { revokedAt: null },
          select: { role: true },
        },
      },
    });

    if (!user) {
      throw new AppError('USER_001', 404);
    }

    return user;
  }

  /**
   * Check if user has role
   */
  static async hasRole(userId: string, role: AppRole): Promise<boolean> {
    const roleRecord = await prisma.userRole.findFirst({
      where: {
        userId,
        role,
        revokedAt: null,
      },
    });

    return !!roleRecord;
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId: string, role: AppRole, grantedBy?: string) {
    try {
      await prisma.userRole.create({
        data: {
          userId,
          role,
          grantedBy,
        },
      });

      logger.info(`Role ${role} assigned to user ${userId}`);
    } catch (error) {
      throw new AppError('ADMIN_005', 400);
    }
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(userId: string, role: AppRole) {
    await prisma.userRole.updateMany({
      where: {
        userId,
        role,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    logger.info(`Role ${role} revoked from user ${userId}`);
  }
}

export default AuthService;
