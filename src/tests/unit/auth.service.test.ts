import AuthService from '../../services/auth.service';
import { prisma } from '../../config/database';
import { createTestUser } from '../setup';

describe('AuthService', () => {
  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = AuthService.generateAccessToken(
        'user-id',
        '0x1234567890123456789012345678901234567890',
        ['user']
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = AuthService.generateAccessToken(
        'user-id',
        '0x1234567890123456789012345678901234567890',
        ['user']
      );

      const payload = AuthService.verifyAccessToken(token);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe('user-id');
      expect(payload.walletAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(payload.roles).toEqual(['user']);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        AuthService.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create a new user', async () => {
      const userData = {
        web3authId: 'test-web3auth-id',
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'test@example.com',
        name: 'Test User',
      };

      const user = await AuthService.createOrUpdateUser(userData);

      expect(user).toBeDefined();
      expect(user.web3authId).toBe(userData.web3authId);
      expect(user.walletAddress).toBe(userData.walletAddress);
      expect(user.email).toBe(userData.email);
      expect(user.roles).toHaveLength(1);
      expect(user.roles[0].role).toBe('user');
    });

    it('should update existing user on login', async () => {
      // Create user first
      const user = await createTestUser({
        web3authId: 'test-web3auth-id',
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'old@example.com',
      });

      // Login with updated email
      const updatedUser = await AuthService.createOrUpdateUser({
        web3authId: 'test-web3auth-id',
        walletAddress: '0x1234567890123456789012345678901234567890',
        email: 'new@example.com',
      });

      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe('new@example.com');
      expect(updatedUser.lastLoginAt).toBeDefined();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', async () => {
      const user = await createTestUser();

      await prisma.userRole.create({
        data: {
          userId: user.id,
          role: 'admin',
        },
      });

      const hasAdminRole = await AuthService.hasRole(user.id, 'admin');
      expect(hasAdminRole).toBe(true);
    });

    it('should return false if user does not have role', async () => {
      const user = await createTestUser();

      const hasAdminRole = await AuthService.hasRole(user.id, 'admin');
      expect(hasAdminRole).toBe(false);
    });
  });
});
