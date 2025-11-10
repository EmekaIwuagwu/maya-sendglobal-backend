import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../../types';
import { asyncHandler } from '../../middleware/error-handler';
import { AppError } from '../../utils/error-codes';
import AuthService from '../../services/auth.service';
import Web3AuthService from '../../services/web3auth.service';
import { logger } from '../../config/logger';

export class AuthController {
  /**
   * POST /api/v1/auth/web3auth/login
   * Login with Web3Auth
   */
  static login = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { web3authToken, walletAddress, email, name } = req.body;

      // Verify Web3Auth token
      const web3AuthPayload = await Web3AuthService.verifyToken(web3authToken);

      // Extract wallet address from payload
      const extractedWallet = Web3AuthService.extractWalletAddress(web3AuthPayload);

      // Validate wallet address matches
      if (extractedWallet.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new AppError('AUTH_004', 401);
      }

      // Create or update user
      const user = await AuthService.createOrUpdateUser({
        web3authId: web3AuthPayload.sub,
        walletAddress,
        email: email || web3AuthPayload.email,
        name,
      });

      // Generate tokens
      const accessToken = AuthService.generateAccessToken(
        user.id,
        user.walletAddress,
        user.roles.map((r) => r.role)
      );

      const refreshToken = AuthService.generateRefreshToken(user.id);

      logger.info(`User logged in: ${user.id}`);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            walletAddress: user.walletAddress,
            email: user.email,
            fullName: user.fullName,
            kycStatus: user.kycStatus,
            kycTier: user.kycTier,
            accountStatus: user.accountStatus,
            balanceUsdc: user.balanceUsdc.toString(),
            roles: user.roles.map((r) => r.role),
          },
          requiresKyc: user.kycStatus !== 'approved',
          wallets: user.wallets,
        },
      });
    }
  );

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  static refresh = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { refreshToken } = req.body;

      // Verify refresh token
      const payload = AuthService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await AuthService.getUserWithRoles(payload.userId);

      // Generate new access token
      const accessToken = AuthService.generateAccessToken(
        user.id,
        user.walletAddress,
        user.roles.map((r) => r.role)
      );

      res.json({
        success: true,
        data: {
          accessToken,
        },
      });
    }
  );

  /**
   * POST /api/v1/auth/logout
   * Logout user
   */
  static logout = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      // TODO: Implement token blacklisting with Redis
      // For now, just return success (client should delete tokens)

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    }
  );

  /**
   * GET /api/v1/auth/me
   * Get current user
   */
  static me = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const user = await AuthService.getUserWithRoles(req.user.id);

      res.json({
        success: true,
        data: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
          fullName: user.fullName,
          kycStatus: user.kycStatus,
          kycTier: user.kycTier,
          accountStatus: user.accountStatus,
          balanceUsdc: user.balanceUsdc.toString(),
          roles: user.roles.map((r) => r.role),
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          profilePictureUrl: user.profilePictureUrl,
          createdAt: user.createdAt,
        },
      });
    }
  );
}

export default AuthController;
