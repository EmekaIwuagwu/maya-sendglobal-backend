import { prisma } from '../config/database';
import { NotificationPayload } from '../types';
import { logger } from '../config/logger';
import EmailService from './email.service';
import SmsService from './sms.service';

export class NotificationService {
  /**
   * Create in-app notification
   */
  static async createNotification(payload: NotificationPayload) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type as any,
          channel: payload.channel as any,
          title: payload.title,
          message: payload.message,
          actionUrl: payload.actionUrl,
          actionText: payload.actionText,
          metadata: payload.metadata || {},
        },
      });

      logger.info(`Notification created for user ${payload.userId}: ${payload.title}`);

      // Send via other channels if specified
      if (payload.channel === 'email' || payload.channel === 'push') {
        await this.sendEmailNotification(payload);
      }

      if (payload.channel === 'sms') {
        await this.sendSmsNotification(payload);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(payload: NotificationPayload) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true, emailVerified: true },
      });

      if (user?.email && user.emailVerified) {
        await EmailService.sendEmail({
          to: user.email,
          subject: payload.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${payload.title}</h2>
              <p>${payload.message}</p>
              ${
                payload.actionUrl
                  ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${payload.actionUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    ${payload.actionText || 'View Details'}
                  </a>
                </div>
              `
                  : ''
              }
            </div>
          `,
        });
      }
    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSmsNotification(payload: NotificationPayload) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { phone: true, phoneVerified: true },
      });

      if (user?.phone && user.phoneVerified) {
        await SmsService.sendSms({
          to: user.phone,
          message: `${payload.title}: ${payload.message}`,
        });
      }
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
    }
  }

  /**
   * Notify transaction completed
   */
  static async notifyTransactionCompleted(
    userId: string,
    transactionId: string,
    amount: string,
    type: 'send' | 'receive'
  ) {
    return this.createNotification({
      userId,
      type: 'transaction',
      channel: 'in_app',
      title: `Transaction ${type === 'send' ? 'Sent' : 'Received'}`,
      message: `Your transaction of ${amount} USDC has been completed successfully.`,
      actionUrl: `/transactions/${transactionId}`,
      actionText: 'View Transaction',
      metadata: { transactionId, amount, type },
    });
  }

  /**
   * Notify KYC status update
   */
  static async notifyKYCStatus(
    userId: string,
    status: 'approved' | 'rejected',
    tier: string,
    reason?: string
  ) {
    return this.createNotification({
      userId,
      type: 'kyc',
      channel: 'in_app',
      title: `KYC ${status === 'approved' ? 'Approved' : 'Update Required'}`,
      message:
        status === 'approved'
          ? `Your KYC verification for ${tier} has been approved.`
          : `Your KYC verification needs attention. ${reason || ''}`,
      actionUrl: '/kyc',
      actionText: 'View KYC Status',
      metadata: { status, tier, reason },
    });
  }

  /**
   * Notify security alert
   */
  static async notifySecurityAlert(userId: string, alert: string) {
    return this.createNotification({
      userId,
      type: 'security',
      channel: 'in_app',
      title: 'Security Alert',
      message: alert,
      actionUrl: '/settings/security',
      actionText: 'Review Security',
      metadata: { alert },
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, limit: number = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}

export default NotificationService;
