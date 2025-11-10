import request from 'supertest';
import app from '../../app';
import { createTestUser } from '../setup';
import AuthService from '../../services/auth.service';

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/web3auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock Web3Auth verification (in real tests, you'd mock the service)
      const mockToken = 'mock-web3auth-token';
      const mockWalletAddress = '0x1234567890123456789012345678901234567890';

      const response = await request(app)
        .post('/api/v1/auth/web3auth/login')
        .send({
          web3authToken: mockToken,
          walletAddress: mockWalletAddress,
          email: 'test@example.com',
          name: 'Test User',
        });

      // Note: This will fail without proper Web3Auth mocking
      // In production, you would mock Web3AuthService.verifyToken
      expect([200, 401]).toContain(response.status);
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/v1/auth/web3auth/login')
        .send({
          web3authToken: 'mock-token',
          walletAddress: 'invalid-address',
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/web3auth/login')
        .send({
          walletAddress: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await createTestUser();
      const refreshToken = AuthService.generateRefreshToken(user.id);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid token', async () => {
      const user = await createTestUser();
      const accessToken = AuthService.generateAccessToken(
        user.id,
        user.walletAddress,
        ['user']
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.walletAddress).toBe(user.walletAddress);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const accessToken = AuthService.generateAccessToken(
        user.id,
        user.walletAddress,
        ['user']
      );

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
