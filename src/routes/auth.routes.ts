import { Router } from 'express';
import AuthController from '../controllers/user/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rate-limit';
import { web3AuthLoginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @swagger
 * /auth/web3auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with Web3Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               web3authToken:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  '/web3auth/login',
  authLimiter,
  validate(web3AuthLoginSchema),
  AuthController.login
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 */
router.get('/me', authenticate, AuthController.me);

export default router;
