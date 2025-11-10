import { Job } from 'bullmq';
import { logger } from '../config/logger';
import TransactionService from '../services/transaction.service';
import BlockchainService from '../services/blockchain.service';
import NotificationService from '../services/notification.service';
import AuditService from '../services/audit.service';

/**
 * Process transaction monitoring job
 */
export async function processTransactionMonitoring(job: Job) {
  const { transactionId, transactionHash } = job.data;

  try {
    logger.info(`Processing transaction monitoring for ${transactionId}`);

    // Wait for transaction confirmation
    const status = await BlockchainService.waitForTransaction(transactionHash, 1);

    if (status === 'confirmed') {
      // Complete transaction
      await TransactionService.completeTransaction(transactionId, transactionHash);

      // Send notification
      const transaction = await TransactionService.getTransactionHistory(
        job.data.userId,
        {}
      );
      const tx = transaction.transactions.find((t) => t.id === transactionId);

      if (tx) {
        await NotificationService.notifyTransactionCompleted(
          tx.senderId!,
          transactionId,
          tx.amountUsdc.toString(),
          'send'
        );

        if (tx.recipientId) {
          await NotificationService.notifyTransactionCompleted(
            tx.recipientId,
            transactionId,
            tx.amountUsdc.toString(),
            'receive'
          );
        }
      }

      // Log audit
      await AuditService.logTransactionEvent(job.data.userId, 'transaction_completed', transactionId, {
        status: 'completed',
        transactionHash,
      });

      logger.info(`Transaction ${transactionId} completed successfully`);
    } else {
      logger.error(`Transaction ${transactionId} failed on blockchain`);
    }

    return { success: true, status };
  } catch (error) {
    logger.error(`Error processing transaction ${transactionId}:`, error);
    throw error;
  }
}

/**
 * Process transaction retry job
 */
export async function processTransactionRetry(job: Job) {
  const { transactionId } = job.data;

  try {
    logger.info(`Retrying transaction ${transactionId}`);

    await TransactionService.processTransaction(transactionId);

    return { success: true };
  } catch (error) {
    logger.error(`Error retrying transaction ${transactionId}:`, error);
    throw error;
  }
}

export default {
  processTransactionMonitoring,
  processTransactionRetry,
};
