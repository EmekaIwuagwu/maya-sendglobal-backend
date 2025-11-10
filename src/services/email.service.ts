import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { EmailOptions } from '../types';

export class EmailService {
  private static readonly SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
  private static readonly FROM_EMAIL = env.FROM_EMAIL;
  private static readonly FROM_NAME = env.FROM_NAME;

  /**
   * Send email using SendGrid
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const payload = {
        personalizations: [
          {
            to: recipients.map((email) => ({ email })),
            subject: options.subject,
            ...(options.templateId && options.templateData
              ? { dynamic_template_data: options.templateData }
              : {}),
          },
        ],
        from: {
          email: this.FROM_EMAIL,
          name: this.FROM_NAME,
        },
        ...(options.templateId
          ? { template_id: options.templateId }
          : {
              content: [
                {
                  type: options.html ? 'text/html' : 'text/plain',
                  value: options.html || options.text || '',
                },
              ],
            }),
      };

      await axios.post(this.SENDGRID_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Email sent to ${recipients.join(', ')}: ${options.subject}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send transaction confirmation email
   */
  static async sendTransactionConfirmation(
    to: string,
    data: {
      userName: string;
      amount: string;
      recipient: string;
      transactionHash: string;
      date: string;
    }
  ) {
    return this.sendEmail({
      to,
      subject: 'Transaction Confirmed - Maya Global Pay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Transaction Confirmed</h2>
          <p>Hi ${data.userName},</p>
          <p>Your transaction has been successfully completed.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${data.amount} USDC</p>
            <p><strong>Recipient:</strong> ${data.recipient}</p>
            <p><strong>Transaction Hash:</strong> ${data.transactionHash}</p>
            <p><strong>Date:</strong> ${data.date}</p>
          </div>

          <p>Thank you for using Maya Global Pay!</p>

          <p style="color: #666; font-size: 12px;">
            If you didn't make this transaction, please contact our support team immediately.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send KYC status update email
   */
  static async sendKYCStatusUpdate(
    to: string,
    data: {
      userName: string;
      status: 'approved' | 'rejected';
      tier: string;
      reason?: string;
    }
  ) {
    const subject =
      data.status === 'approved'
        ? 'KYC Verification Approved - Maya Global Pay'
        : 'KYC Verification Update - Maya Global Pay';

    return this.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>KYC Verification ${data.status === 'approved' ? 'Approved' : 'Update'}</h2>
          <p>Hi ${data.userName},</p>

          ${
            data.status === 'approved'
              ? `
            <p>Congratulations! Your KYC verification for <strong>${data.tier}</strong> has been approved.</p>
            <p>You can now access all features available for this tier.</p>
          `
              : `
            <p>We need additional information to complete your KYC verification.</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            <p>Please log in to your account to submit the required documents.</p>
          `
          }

          <p>Thank you for choosing Maya Global Pay!</p>
        </div>
      `,
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(to: string, userName: string) {
    return this.sendEmail({
      to,
      subject: 'Welcome to Maya Global Pay!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Maya Global Pay!</h2>
          <p>Hi ${userName},</p>
          <p>Thank you for joining Maya Global Pay - your Web3 payment platform.</p>

          <h3>Getting Started:</h3>
          <ol>
            <li>Complete your KYC verification to unlock all features</li>
            <li>Add funds to your wallet</li>
            <li>Start sending and receiving USDC payments</li>
          </ol>

          <p>If you have any questions, our support team is here to help.</p>

          <p>Best regards,<br>Maya Global Pay Team</p>
        </div>
      `,
    });
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(to: string, resetLink: string) {
    return this.sendEmail({
      to,
      subject: 'Password Reset - Maya Global Pay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password.</p>

          <p>Click the button below to reset your password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p>This link will expire in 1 hour.</p>

          <p style="color: #666; font-size: 12px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });
  }

  /**
   * Send 2FA code email
   */
  static async send2FACode(to: string, code: string) {
    return this.sendEmail({
      to,
      subject: 'Your 2FA Code - Maya Global Pay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Two-Factor Authentication</h2>
          <p>Your 2FA verification code is:</p>

          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>

          <p>This code will expire in 10 minutes.</p>

          <p style="color: #666; font-size: 12px;">
            If you didn't request this code, please contact our support team immediately.
          </p>
        </div>
      `,
    });
  }
}

export default EmailService;
