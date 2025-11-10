import { z } from 'zod';

export const web3AuthLoginSchema = z.object({
  web3authToken: z.string().min(1, 'Web3Auth token is required'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  deviceInfo: z.object({}).passthrough().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const confirmEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const setup2FASchema = z.object({});

export const verify2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
});

export const disable2FASchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits'),
  password: z.string().min(1, 'Password is required'),
});

export default {
  web3AuthLoginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  confirmEmailSchema,
  setup2FASchema,
  verify2FASchema,
  disable2FASchema,
};
