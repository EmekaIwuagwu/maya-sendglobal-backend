import { prisma } from '../config/database';
import { AppError } from '../utils/error-codes';
import { logger } from '../config/logger';
import CloudinaryService from './cloudinary.service';
import EmailService from './email.service';
import { KycStatus, KycTier } from '@prisma/client';

export class KYCService {
  /**
   * Submit KYC documents
   */
  static async submitKYCDocuments(
    userId: string,
    documents: {
      documentType: string;
      file: Express.Multer.File;
    }[]
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          kycStatus: true,
        },
      });

      if (!user) {
        throw new AppError('USER_001', 404);
      }

      if (user.kycStatus === 'approved') {
        throw new AppError('KYC_002', 400);
      }

      // Upload documents to Cloudinary
      const uploadedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const uploadResult = await CloudinaryService.uploadKYCDocument(doc.file, userId);
          return {
            documentType: doc.documentType,
            documentUrl: uploadResult.url,
            documentKey: uploadResult.key,
          };
        })
      );

      // Create KYC submission record
      const kycSubmission = await prisma.kYCSubmission.create({
        data: {
          userId,
          tier: 'tier1',
          status: 'pending',
          documents: {
            create: uploadedDocuments.map((doc) => ({
              documentType: doc.documentType,
              documentUrl: doc.documentUrl,
              storageKey: doc.documentKey,
            })),
          },
        },
      });

      // Update user KYC status
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'pending',
        },
      });

      logger.info(`KYC documents submitted for user ${userId}`);

      // Send email notification
      if (user.email) {
        EmailService.sendKYCSubmitted(user.email, {
          userName: user.fullName || 'there',
        }).catch((error) => {
          logger.error(`Failed to send KYC submission email to ${user.email}:`, error);
        });
      }

      return kycSubmission;
    } catch (error) {
      logger.error('Error submitting KYC documents:', error);
      throw error;
    }
  }

  /**
   * Update KYC status (Admin function)
   */
  static async updateKYCStatus(
    submissionId: string,
    status: KycStatus,
    reviewedBy: string,
    rejectionReason?: string
  ) {
    try {
      const submission = await prisma.kYCSubmission.findUnique({
        where: { id: submissionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
      });

      if (!submission) {
        throw new AppError('KYC_001', 404);
      }

      // Update submission
      const updatedSubmission = await prisma.kYCSubmission.update({
        where: { id: submissionId },
        data: {
          status,
          reviewedBy,
          reviewedAt: new Date(),
          rejectionReason,
        },
      });

      // Update user KYC status
      await prisma.user.update({
        where: { id: submission.userId },
        data: {
          kycStatus: status,
          kycTier: status === 'approved' ? submission.tier : undefined,
        },
      });

      logger.info(`KYC status updated to ${status} for submission ${submissionId}`);

      // Send email notification based on status
      if (submission.user.email) {
        if (status === 'approved') {
          EmailService.sendKYCApproved(submission.user.email, {
            userName: submission.user.fullName || 'there',
            tier: submission.tier,
          }).catch((error) => {
            logger.error(`Failed to send KYC approval email to ${submission.user.email}:`, error);
          });
        } else if (status === 'rejected') {
          EmailService.sendKYCRejected(submission.user.email, {
            userName: submission.user.fullName || 'there',
            reason: rejectionReason || 'Documents did not meet requirements',
            resubmitUrl: `${process.env.FRONTEND_URL}/kyc/submit`,
          }).catch((error) => {
            logger.error(`Failed to send KYC rejection email to ${submission.user.email}:`, error);
          });
        }
      }

      return updatedSubmission;
    } catch (error) {
      logger.error('Error updating KYC status:', error);
      throw error;
    }
  }

  /**
   * Get user KYC status
   */
  static async getUserKYCStatus(userId: string) {
    const submissions = await prisma.kYCSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    });

    return submissions;
  }

  /**
   * Get all pending KYC submissions (Admin)
   */
  static async getPendingSubmissions(filters?: {
    tier?: KycTier;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'pending',
    };

    if (filters?.tier) {
      where.tier = filters.tier;
    }

    const [submissions, total] = await Promise.all([
      prisma.kYCSubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              walletAddress: true,
            },
          },
          documents: true,
        },
      }),
      prisma.kYCSubmission.count({ where }),
    ]);

    return {
      submissions,
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

export default KYCService;
