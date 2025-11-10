import { prisma } from '../config/database';
import { AppError } from '../utils/error-codes';
import { logger } from '../config/logger';
import { generateReferenceNumber, calculateFee, decimalToString } from '../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import { env } from '../config/env';
import BlockchainService from './blockchain.service';
import CircleService from './circle.service';

export class TransactionService {
  /**
   * Create a transaction
   */
  static async createTransaction(data: {
    senderId: string;
    recipientWallet?: string;
    recipientEmail?: string;
    amount: string;
    type: 'send' | 'deposit' | 'withdraw';
    note?: string;
  }) {
    try {
      // Validate amount
      const amount = new Decimal(data.amount);
      if (amount.lte(0)) {
        throw new AppError('TXN_008', 400);
      }

      if (amount.lt(env.MIN_TRANSACTION_AMOUNT)) {
        throw new AppError('TXN_008', 400);
      }

      if (amount.gt(env.DEFAULT_TRANSACTION_LIMIT)) {
        throw new AppError('TXN_009', 400);
      }

      // Get sender
      const sender = await prisma.user.findUnique({
        where: { id: data.senderId },
      });

      if (!sender) {
        throw new AppError('USER_001', 404);
      }

      // Calculate fee
      const feeAmount = calculateFee(amount, env.TRANSACTION_FEE_PERCENT);
      const totalAmount = amount.plus(feeAmount);

      // Check balance
      if (new Decimal(sender.balanceUsdc).lt(totalAmount)) {
        throw new AppError('TXN_001', 400);
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await prisma.transaction.aggregate({
        where: {
          senderId: sender.id,
          createdAt: { gte: today },
          status: { in: ['completed', 'processing'] },
        },
        _sum: {
          amountUsdc: true,
        },
      });

      const todayTotal = new Decimal(todayTransactions._sum.amountUsdc || 0);
      if (todayTotal.plus(amount).gt(env.DEFAULT_DAILY_LIMIT)) {
        throw new AppError('TXN_003', 400);
      }

      // Find or create recipient
      let recipientId: string | undefined;
      if (data.recipientWallet) {
        const recipient = await prisma.user.findUnique({
          where: { walletAddress: data.recipientWallet },
        });
        recipientId = recipient?.id;
      }

      // Create transaction
      const transaction = await prisma.$transaction(async (tx) => {
        // Deduct from sender balance
        await tx.user.update({
          where: { id: sender.id },
          data: {
            balanceUsdc: { decrement: totalAmount },
          },
        });

        // Create transaction record
        return await tx.transaction.create({
          data: {
            senderId: sender.id,
            senderWallet: sender.walletAddress,
            recipientId,
            recipientWallet: data.recipientWallet,
            recipientEmail: data.recipientEmail,
            amountUsdc: amount,
            feeUsdc: new Decimal(feeAmount),
            transactionType: data.type,
            status: 'pending',
            chain: 'base',
            network: env.DEFAULT_NETWORK,
            referenceNumber: generateReferenceNumber(),
            note: data.note,
            gasSponsored: true,
          },
        });
      });

      logger.info(`Transaction created: ${transaction.id}`);

      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Process transaction on blockchain
   */
  static async processTransaction(transactionId: string) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        throw new AppError('TXN_010', 404);
      }

      if (transaction.status !== 'pending') {
        throw new AppError('TXN_012', 400);
      }

      // Update status to processing
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'processing',
          processingAt: new Date(),
        },
      });

      // Build transaction data
      const txData = BlockchainService.buildTransferData(
        transaction.recipientWallet!,
        decimalToString(transaction.amountUsdc)
      );

      // Sponsor transaction with Circle Paymaster
      const paymasterResponse = await CircleService.sponsorTransaction({
        chainId: txData.chainId,
        from: transaction.senderWallet!,
        to: txData.to,
        data: `0x${txData.recipient}${txData.amount.toString(16).padStart(64, '0')}`,
      });

      // Update transaction with blockchain data
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          paymasterTxHash: paymasterResponse.paymasterTxHash,
          paymasterSponsorAddress: paymasterResponse.sponsorAddress,
          status: 'processing',
        },
      });

      // Monitor transaction (this would be done in a background job)
      // For now, we'll just return the transaction

      logger.info(`Transaction processing: ${transactionId}`);

      return await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
    } catch (error) {
      logger.error('Error processing transaction:', error);

      // Update transaction status to failed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Complete transaction
   */
  static async completeTransaction(transactionId: string, transactionHash: string) {
    try {
      const transaction = await prisma.$transaction(async (tx) => {
        // Get transaction
        const txn = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!txn) {
          throw new AppError('TXN_010', 404);
        }

        // Credit recipient if they exist
        if (txn.recipientId) {
          await tx.user.update({
            where: { id: txn.recipientId },
            data: {
              balanceUsdc: { increment: txn.amountUsdc },
            },
          });
        }

        // Update transaction
        return await tx.transaction.update({
          where: { id: transactionId },
          data: {
            transactionHash,
            status: 'completed',
            completedAt: new Date(),
          },
        });
      });

      logger.info(`Transaction completed: ${transactionId}`);

      return transaction;
    } catch (error) {
      logger.error('Error completing transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(userId: string, filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ senderId: userId }, { recipientId: userId }],
    };

    if (filters?.type) {
      where.transactionType = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              walletAddress: true,
              fullName: true,
              email: true,
            },
          },
          recipient: {
            select: {
              id: true,
              walletAddress: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

export default TransactionService;
