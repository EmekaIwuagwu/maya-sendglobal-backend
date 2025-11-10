import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../../types';
import { asyncHandler } from '../../middleware/error-handler';
import { AppError } from '../../utils/error-codes';
import TransactionService from '../../services/transaction.service';
import { calculateFee } from '../../utils/helpers';
import { env } from '../../config/env';

export class TransactionController {
  /**
   * POST /api/v1/transactions/send
   * Send USDC transaction
   */
  static send = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const { recipientAddress, recipientEmail, amount, note } = req.body;

      // Create transaction
      const transaction = await TransactionService.createTransaction({
        senderId: req.user.id,
        recipientWallet: recipientAddress,
        recipientEmail,
        amount,
        type: 'send',
        note,
      });

      // Process transaction on blockchain (in background)
      // For now, we'll do it synchronously
      const processedTransaction = await TransactionService.processTransaction(transaction.id);

      res.json({
        success: true,
        data: {
          transactionId: processedTransaction!.id,
          transactionHash: processedTransaction!.transactionHash,
          paymasterTxHash: processedTransaction!.paymasterTxHash,
          status: processedTransaction!.status,
          amount: processedTransaction!.amountUsdc.toString(),
          fee: processedTransaction!.feeUsdc.toString(),
          referenceNumber: processedTransaction!.referenceNumber,
        },
      });
    }
  );

  /**
   * GET /api/v1/transactions/history
   * Get transaction history
   */
  static history = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const filters = {
        type: req.query.type as string,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await TransactionService.getTransactionHistory(req.user.id, filters);

      res.json({
        success: true,
        data: {
          transactions: result.transactions.map((tx) => ({
            id: tx.id,
            type: tx.transactionType,
            status: tx.status,
            amount: tx.amountUsdc.toString(),
            fee: tx.feeUsdc.toString(),
            transactionHash: tx.transactionHash,
            referenceNumber: tx.referenceNumber,
            sender: tx.sender,
            recipient: tx.recipient,
            note: tx.note,
            createdAt: tx.createdAt,
            completedAt: tx.completedAt,
          })),
        },
        pagination: result.pagination,
      });
    }
  );

  /**
   * GET /api/v1/transactions/:id
   * Get transaction by ID
   */
  static getById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const { id } = req.params;

      const transaction = await TransactionService.getTransactionHistory(req.user.id, {
        page: 1,
        limit: 1,
      });

      const found = transaction.transactions.find((tx) => tx.id === id);

      if (!found) {
        throw new AppError('TXN_010', 404);
      }

      res.json({
        success: true,
        data: {
          id: found.id,
          type: found.transactionType,
          status: found.status,
          amount: found.amountUsdc.toString(),
          fee: found.feeUsdc.toString(),
          transactionHash: found.transactionHash,
          referenceNumber: found.referenceNumber,
          sender: found.sender,
          recipient: found.recipient,
          note: found.note,
          createdAt: found.createdAt,
          completedAt: found.completedAt,
        },
      });
    }
  );

  /**
   * POST /api/v1/transactions/estimate-fee
   * Estimate transaction fee
   */
  static estimateFee = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      const { amount, type } = req.body;

      const feePercent =
        type === 'withdraw' ? env.WITHDRAWAL_FEE_PERCENT : env.TRANSACTION_FEE_PERCENT;

      const fee = calculateFee(amount, feePercent);
      const total = parseFloat(amount) + parseFloat(fee);

      res.json({
        success: true,
        data: {
          estimatedFee: fee,
          gasEstimate: '0', // Gasless with Circle Paymaster
          totalAmount: total.toFixed(6),
          gasSponsored: true,
        },
      });
    }
  );

  /**
   * GET /api/v1/transactions/pending
   * Get pending transactions
   */
  static pending = asyncHandler(
    async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
      if (!req.user) {
        throw new AppError('AUTH_003', 401);
      }

      const result = await TransactionService.getTransactionHistory(req.user.id, {
        status: 'pending',
        page: 1,
        limit: 50,
      });

      res.json({
        success: true,
        data: result.transactions.map((tx) => ({
          id: tx.id,
          type: tx.transactionType,
          status: tx.status,
          amount: tx.amountUsdc.toString(),
          fee: tx.feeUsdc.toString(),
          referenceNumber: tx.referenceNumber,
          createdAt: tx.createdAt,
        })),
      });
    }
  );
}

export default TransactionController;
