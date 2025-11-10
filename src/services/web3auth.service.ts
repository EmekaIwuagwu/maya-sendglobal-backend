import axios from 'axios';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error-codes';
import { Web3AuthPayload } from '../types';

export class Web3AuthService {
  private static jwksClient = jwksClient({
    jwksUri: env.WEB3AUTH_JWKS_URL,
    cache: true,
    cacheMaxAge: 86400000, // 24 hours
  });

  /**
   * Verify Web3Auth JWT token
   */
  static async verifyToken(token: string): Promise<Web3AuthPayload> {
    try {
      // Decode token header to get kid
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.header.kid) {
        throw new AppError('AUTH_004', 401);
      }

      // Get signing key
      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const signingKey = key.getPublicKey();

      // Verify token
      const payload = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        audience: env.WEB3AUTH_CLIENT_ID,
      }) as Web3AuthPayload;

      // Validate issuer
      if (!payload.iss.includes('web3auth.io')) {
        throw new AppError('AUTH_004', 401);
      }

      // Validate expiry
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new AppError('AUTH_002', 401);
      }

      return payload;
    } catch (error) {
      logger.error('Web3Auth token verification error:', error);

      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('AUTH_002', 401);
      }

      throw new AppError('AUTH_004', 401);
    }
  }

  /**
   * Get user info from Web3Auth
   */
  static async getUserInfo(web3authId: string) {
    try {
      // This would call Web3Auth's API to get user info
      // For now, return basic structure
      return {
        web3authId,
        verified: true,
      };
    } catch (error) {
      logger.error('Error getting Web3Auth user info:', error);
      return null;
    }
  }

  /**
   * Extract wallet address from Web3Auth payload
   */
  static extractWalletAddress(payload: Web3AuthPayload): string {
    if (payload.wallets && payload.wallets.length > 0) {
      // Return the first wallet's public key as address
      return payload.wallets[0].public_key;
    }

    // Fallback: derive from subject
    return payload.sub;
  }
}

export default Web3AuthService;
