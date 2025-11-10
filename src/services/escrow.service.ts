import { prisma } from '../config/database';
import { AppError } from '../utils/error-codes';
import { logger } from '../config/logger';
import { generateReferenceNumber, decimalToString } from '../utils/helpers';
import { Decimal } from '@prisma/client/runtime/library';
import { env } from '../config/env';
import EmailService from './email.service';
import CloudinaryService from './cloudinary.service';

export class EscrowService {
  /**
   * Create escrow
   */
  static async createEscrow(data: {
    senderId: string;
    recipientWallet?: string;
    recipientEmail?: string;
    amount: string;
    description: string;
    conditions?: string;
  }) {
    try {
      const sender = await prisma.user.findUnique({
        where: { id: data.senderId },
        select: {
          id: true,
          email: true,
          fullName: true,
          walletAddress: true,
          balanceUsdc: true,
        },
      });

      if (!sender) {
        throw new AppError('USER_001', 404);
      }

      const amount = new Decimal(data.amount);

      // Check balance
      if (new Decimal(sender.balanceUsdc).lt(amount)) {
        throw new AppError('TXN_001', 400);
      }

      // Find recipient
      let recipientId: string | undefined;
      let recipient: any;
      if (data.recipientWallet) {
        recipient = await prisma.user.findUnique({
          where: { walletAddress: data.recipientWallet },
          select: {
            id: true,
            email: true,
            fullName: true,
            walletAddress: true,
          },
        });
        recipientId = recipient?.id;
      }

      // Create escrow
      const escrow = await prisma.$transaction(async (tx) => {
        // Deduct from sender balance
        await tx.user.update({
          where: { id: sender.id },
          data: {
            balanceUsdc: { decrement: amount },
          },
        });

        // Create escrow record
        return await tx.escrow.create({
          data: {
            buyerId: sender.id,
            buyerWallet: sender.walletAddress,
            sellerId: recipientId,
            sellerWallet: data.recipientWallet,
            sellerEmail: data.recipientEmail,
            amountUsdc: amount,
            description: data.description,
            conditions: data.conditions,
            status: 'active',
            referenceNumber: generateReferenceNumber(),
          },
        });
      });

      logger.info(`Escrow created: ${escrow.id}`);

      // Send email to buyer
      if (sender.email) {
        EmailService.sendEscrowCreated(sender.email, {
          userName: sender.fullName || 'there',
          amount: decimalToString(amount),
          recipient: recipient?.fullName || data.recipientEmail || data.recipientWallet || 'Unknown',
          referenceNumber: escrow.referenceNumber,
          escrowUrl: `${env.FRONTEND_URL}/escrow/${escrow.id}`,
        }).catch((error) => {
          logger.error(`Failed to send escrow creation email to ${sender.email}:`, error);
        });
      }

      // Send email to seller if they have an account
      if (recipient?.email) {
        EmailService.sendEscrowReceived(recipient.email, {
          userName: recipient.fullName || 'there',
          amount: decimalToString(amount),
          sender: sender.fullName || sender.walletAddress,
          description: data.description,
          referenceNumber: escrow.referenceNumber,
          escrowUrl: `${env.FRONTEND_URL}/escrow/${escrow.id}`,
        }).catch((error) => {
          logger.error(`Failed to send escrow notification email to ${recipient.email}:`, error);
        });
      }

      return escrow;
    } catch (error) {
      logger.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Release escrow funds
   */
  static async releaseEscrow(escrowId: string, releasedBy: string) {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: escrowId },
        include: {
          buyer: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          seller: {
            select: {
              id: true,
              email: true,
              fullName: true,
              walletAddress: true,
            },
          },
        },
      });

      if (!escrow) {
        throw new AppError('ESCROW_001', 404);
      }

      if (escrow.status !== 'active') {
        throw new AppError('ESCROW_003', 400);
      }

      if (escrow.buyerId !== releasedBy) {
        throw new AppError('AUTH_003', 403);
      }

      // Release funds
      const releasedEscrow = await prisma.$transaction(async (tx) => {
        // Credit seller if they exist
        if (escrow.sellerId) {
          await tx.user.update({
            where: { id: escrow.sellerId },
            data: {
              balanceUsdc: { increment: escrow.amountUsdc },
            },
          });
        }

        // Update escrow status
        return await tx.escrow.update({
          where: { id: escrowId },
          data: {
            status: 'completed',
            releasedAt: new Date(),
          },
          include: {
            buyer: {
              select: {
                email: true,
                fullName: true,
              },
            },
            seller: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
        });
      });

      logger.info(`Escrow released: ${escrowId}`);

      // Send email to buyer
      if (escrow.buyer?.email) {
        EmailService.sendEscrowReleased(escrow.buyer.email, {
          userName: escrow.buyer.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          recipient: escrow.seller?.fullName || escrow.sellerWallet || escrow.sellerEmail || 'Unknown',
          referenceNumber: escrow.referenceNumber,
        }).catch((error) => {
          logger.error(`Failed to send escrow release email to ${escrow.buyer.email}:`, error);
        });
      }

      // Send email to seller
      if (escrow.seller?.email) {
        EmailService.sendEscrowCompleted(escrow.seller.email, {
          userName: escrow.seller.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          sender: escrow.buyer?.fullName || escrow.buyerWallet || 'Unknown',
          referenceNumber: escrow.referenceNumber,
        }).catch((error) => {
          logger.error(`Failed to send escrow completion email to ${escrow.seller.email}:`, error);
        });
      }

      return releasedEscrow;
    } catch (error) {
      logger.error('Error releasing escrow:', error);
      throw error;
    }
  }

  /**
   * Create dispute
   */
  static async createDispute(data: {
    escrowId: string;
    raisedBy: string;
    reason: string;
    evidence?: Express.Multer.File[];
  }) {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { id: data.escrowId },
        include: {
          buyer: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          seller: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (!escrow) {
        throw new AppError('ESCROW_001', 404);
      }

      if (escrow.status !== 'active') {
        throw new AppError('ESCROW_003', 400);
      }

      // Check if user is buyer or seller
      if (escrow.buyerId !== data.raisedBy && escrow.sellerId !== data.raisedBy) {
        throw new AppError('AUTH_003', 403);
      }

      // Upload evidence files if provided
      let evidenceUrls: string[] = [];
      if (data.evidence && data.evidence.length > 0) {
        const uploadResults = await Promise.all(
          data.evidence.map(async (file) => {
            const result = await CloudinaryService.uploadDisputeEvidence(file, data.escrowId);
            return result.url;
          })
        );
        evidenceUrls = uploadResults;
      }

      // Create dispute
      const dispute = await prisma.$transaction(async (tx) => {
        // Update escrow status
        await tx.escrow.update({
          where: { id: data.escrowId },
          data: {
            status: 'disputed',
          },
        });

        // Create dispute record
        return await tx.dispute.create({
          data: {
            escrowId: data.escrowId,
            raisedBy: data.raisedBy,
            reason: data.reason,
            evidence: evidenceUrls.length > 0 ? JSON.stringify(evidenceUrls) : undefined,
            status: 'pending',
          },
        });
      });

      logger.info(`Dispute created for escrow ${data.escrowId}`);

      // Determine who raised the dispute
      const isRaisedByBuyer = escrow.buyerId === data.raisedBy;
      const raiser = isRaisedByBuyer ? escrow.buyer : escrow.seller;
      const otherParty = isRaisedByBuyer ? escrow.seller : escrow.buyer;

      // Send email to the person who raised the dispute
      if (raiser?.email) {
        EmailService.sendDisputeOpened(raiser.email, {
          userName: raiser.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          referenceNumber: escrow.referenceNumber,
          disputeReason: data.reason,
        }).catch((error) => {
          logger.error(`Failed to send dispute email to ${raiser.email}:`, error);
        });
      }

      // Send email to the other party
      if (otherParty?.email) {
        EmailService.sendDisputeNotification(otherParty.email, {
          userName: otherParty.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          referenceNumber: escrow.referenceNumber,
          disputeReason: data.reason,
        }).catch((error) => {
          logger.error(`Failed to send dispute notification to ${otherParty.email}:`, error);
        });
      }

      return dispute;
    } catch (error) {
      logger.error('Error creating dispute:', error);
      throw error;
    }
  }

  /**
   * Resolve dispute (Admin function)
   */
  static async resolveDispute(data: {
    disputeId: string;
    resolvedBy: string;
    resolution: 'buyer' | 'seller' | 'split';
    resolutionNotes?: string;
  }) {
    try {
      const dispute = await prisma.dispute.findUnique({
        where: { id: data.disputeId },
        include: {
          escrow: {
            include: {
              buyer: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
        },
      });

      if (!dispute) {
        throw new AppError('DISPUTE_001', 404);
      }

      if (dispute.status !== 'pending') {
        throw new AppError('DISPUTE_003', 400);
      }

      const escrow = dispute.escrow;

      // Resolve based on resolution type
      await prisma.$transaction(async (tx) => {
        if (data.resolution === 'buyer') {
          // Refund to buyer
          await tx.user.update({
            where: { id: escrow.buyerId },
            data: {
              balanceUsdc: { increment: escrow.amountUsdc },
            },
          });
        } else if (data.resolution === 'seller') {
          // Release to seller
          if (escrow.sellerId) {
            await tx.user.update({
              where: { id: escrow.sellerId },
              data: {
                balanceUsdc: { increment: escrow.amountUsdc },
              },
            });
          }
        } else if (data.resolution === 'split') {
          // Split 50/50
          const halfAmount = new Decimal(escrow.amountUsdc).div(2);
          await tx.user.update({
            where: { id: escrow.buyerId },
            data: {
              balanceUsdc: { increment: halfAmount },
            },
          });
          if (escrow.sellerId) {
            await tx.user.update({
              where: { id: escrow.sellerId },
              data: {
                balanceUsdc: { increment: halfAmount },
              },
            });
          }
        }

        // Update dispute
        await tx.dispute.update({
          where: { id: data.disputeId },
          data: {
            status: 'resolved',
            resolution: data.resolution,
            resolvedBy: data.resolvedBy,
            resolvedAt: new Date(),
            resolutionNotes: data.resolutionNotes,
          },
        });

        // Update escrow
        await tx.escrow.update({
          where: { id: escrow.id },
          data: {
            status: 'resolved',
          },
        });
      });

      logger.info(`Dispute ${data.disputeId} resolved in favor of ${data.resolution}`);

      // Send resolution emails
      if (escrow.buyer?.email) {
        EmailService.sendDisputeResolved(escrow.buyer.email, {
          userName: escrow.buyer.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          resolution: data.resolution,
          resolutionNotes: data.resolutionNotes,
          referenceNumber: escrow.referenceNumber,
        }).catch((error) => {
          logger.error(`Failed to send resolution email to buyer ${escrow.buyer.email}:`, error);
        });
      }

      if (escrow.seller?.email) {
        EmailService.sendDisputeResolved(escrow.seller.email, {
          userName: escrow.seller.fullName || 'there',
          amount: decimalToString(escrow.amountUsdc),
          resolution: data.resolution,
          resolutionNotes: data.resolutionNotes,
          referenceNumber: escrow.referenceNumber,
        }).catch((error) => {
          logger.error(`Failed to send resolution email to seller ${escrow.seller.email}:`, error);
        });
      }

      return dispute;
    } catch (error) {
      logger.error('Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Get user escrows
   */
  static async getUserEscrows(userId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [escrows, total] = await Promise.all([
      prisma.escrow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: {
              id: true,
              walletAddress: true,
              fullName: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              walletAddress: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.escrow.count({ where }),
    ]);

    return {
      escrows,
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

export default EscrowService;
