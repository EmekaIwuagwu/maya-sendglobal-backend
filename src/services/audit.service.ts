import { prisma } from '../config/database';
import { AuditLogData } from '../types';
import { logger } from '../config/logger';

export class AuditService {
  /**
   * Create audit log entry
   */
  static async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          adminId: data.adminId,
          action: data.action,
          actionCategory: data.actionCategory,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          changes: data.changes || {},
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
          metadata: data.metadata || {},
        },
      });

      logger.info(`Audit log created: ${data.action}`);
    } catch (error) {
      logger.error('Error creating audit log:', error);
    }
  }

  /**
   * Log user action
   */
  static async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      userId,
      action,
      actionCategory: 'user_action',
      resourceType,
      resourceId,
      metadata,
    });
  }

  /**
   * Log admin action
   */
  static async logAdminAction(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    changes?: Record<string, unknown>,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ) {
    return this.log({
      adminId,
      action,
      actionCategory: 'admin_action',
      resourceType,
      resourceId,
      changes,
      oldValues,
      newValues,
    });
  }

  /**
   * Log authentication event
   */
  static async logAuthEvent(
    userId: string | undefined,
    action: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
  ) {
    return this.log({
      userId,
      action,
      actionCategory: 'authentication',
      resourceType: 'user',
      success,
      ipAddress,
      userAgent,
      errorMessage,
    });
  }

  /**
   * Log transaction event
   */
  static async logTransactionEvent(
    userId: string,
    action: string,
    transactionId: string,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      userId,
      action,
      actionCategory: 'transaction',
      resourceType: 'transaction',
      resourceId: transactionId,
      metadata,
    });
  }

  /**
   * Log KYC event
   */
  static async logKYCEvent(
    userId: string,
    action: string,
    kycSubmissionId: string,
    reviewerId?: string,
    changes?: Record<string, unknown>
  ) {
    return this.log({
      userId,
      adminId: reviewerId,
      action,
      actionCategory: 'kyc',
      resourceType: 'kyc_submission',
      resourceId: kycSubmissionId,
      changes,
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    userId: string | undefined,
    action: string,
    ipAddress?: string,
    metadata?: Record<string, unknown>
  ) {
    return this.log({
      userId,
      action,
      actionCategory: 'security',
      resourceType: 'user',
      ipAddress,
      metadata,
    });
  }

  /**
   * Get user audit logs
   */
  static async getUserLogs(userId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get admin audit logs
   */
  static async getAdminLogs(adminId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get resource audit logs
   */
  static async getResourceLogs(resourceType: string, resourceId: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export default AuditService;
