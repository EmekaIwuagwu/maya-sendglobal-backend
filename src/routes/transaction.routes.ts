import { Router } from 'express';
import TransactionController from '../controllers/user/transaction.controller';
import { validate, validateAll } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { transactionLimiter } from '../middleware/rate-limit';
import {
  sendTransactionSchema,
  estimateFeeSchema,
  transactionIdSchema,
  transactionFilterSchema,
} from '../validators/transaction.validator';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /transactions/send:
 *   post:
 *     tags: [Transactions]
 *     summary: Send USDC transaction
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientAddress:
 *                 type: string
 *               recipientEmail:
 *                 type: string
 *               amount:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction sent successfully
 */
router.post(
  '/send',
  transactionLimiter,
  validate(sendTransactionSchema),
  TransactionController.send
);

/**
 * @swagger
 * /transactions/history:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction history
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 */
router.get('/history', validate(transactionFilterSchema, 'query'), TransactionController.history);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 */
router.get('/:id', validate(transactionIdSchema, 'params'), TransactionController.getById);

/**
 * @swagger
 * /transactions/estimate-fee:
 *   post:
 *     tags: [Transactions]
 *     summary: Estimate transaction fee
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               recipientAddress:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [send, withdraw]
 *     responses:
 *       200:
 *         description: Fee estimated successfully
 */
router.post('/estimate-fee', validate(estimateFeeSchema), TransactionController.estimateFee);

/**
 * @swagger
 * /transactions/pending:
 *   get:
 *     tags: [Transactions]
 *     summary: Get pending transactions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending transactions retrieved successfully
 */
router.get('/pending', TransactionController.pending);

export default router;
