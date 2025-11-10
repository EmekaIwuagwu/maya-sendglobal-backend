import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { EmailOptions } from '../types';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  private static FROM_EMAIL = env.FROM_EMAIL;
  private static FROM_NAME = env.FROM_NAME;

  /**
   * Send email using SMTP
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const mailOptions = {
        from: `"${this.FROM_NAME}" <${this.FROM_EMAIL}>`,
        to: recipients.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent to ${recipients.join(', ')}: ${options.subject}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Verify SMTP connection
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Get email wrapper template
   */
  private static getEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maya Global Pay</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Maya Global Pay</h1>
                    <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Your Web3 Payment Platform</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    ${content}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                      Need help? Contact us at <a href="mailto:${env.SUPPORT_EMAIL}" style="color: #667eea;">${env.SUPPORT_EMAIL}</a>
                    </p>
                    <p style="color: #6c757d; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Maya Global Pay. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(
    to: string,
    data: {
      userName: string;
      walletAddress: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">Welcome to Maya Global Pay! 🎉</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Thank you for joining Maya Global Pay - your gateway to seamless Web3 payments powered by USDC on Base Network.
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #333; font-size: 14px;"><strong>Your Wallet Address:</strong></p>
        <p style="margin: 5px 0 0 0; color: #667eea; font-family: monospace; font-size: 13px; word-break: break-all;">${data.walletAddress}</p>
      </div>

      <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px;">Getting Started:</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 12px 0;">
            <div style="display: flex; align-items: center;">
              <div style="background-color: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">1</div>
              <span style="color: #555; font-size: 15px;">Complete your KYC verification to unlock all features</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <div style="display: flex; align-items: center;">
              <div style="background-color: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">2</div>
              <span style="color: #555; font-size: 15px;">Fund your wallet with USDC</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <div style="display: flex; align-items: center;">
              <div style="background-color: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">3</div>
              <span style="color: #555; font-size: 15px;">Start sending gasless payments worldwide</span>
            </div>
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin: 35px 0 20px 0;">
        <a href="${env.FRONTEND_URL}/dashboard" style="background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 15px;">
          Go to Dashboard
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Maya Global Pay! 🎉',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send email payment notification
   */
  static async sendEmailPaymentNotification(
    to: string,
    data: {
      senderName: string;
      amount: string;
      claimUrl: string;
      expiresAt: string;
    }
  ) {
    const expiryDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">You've Received Money! 💰</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hello,</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        <strong>${data.senderName}</strong> has sent you <strong style="color: #667eea;">${data.amount} USDC</strong> via Maya Global Pay.
      </p>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Amount Sent</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold;">${data.amount} USDC</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Click the button below to claim your funds. You'll need to create a free Maya Global Pay account or sign in if you already have one.
      </p>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${data.claimUrl}" style="background-color: #28a745; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
          Claim Your Funds
        </a>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          ⏰ <strong>Important:</strong> This payment link expires on <strong>${expiryDate}</strong>. Make sure to claim your funds before then!
        </p>
      </div>

      <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
        <strong>What is Maya Global Pay?</strong><br>
        Maya Global Pay is a Web3 payment platform that makes sending and receiving USDC easy, fast, and gasless on Base Network.
      </p>
    `;

    return this.sendEmail({
      to,
      subject: `You've received ${data.amount} USDC from ${data.senderName}! 💰`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send transaction confirmation
   */
  static async sendTransactionConfirmation(
    to: string,
    data: {
      userName: string;
      amount: string;
      recipient: string;
      transactionHash: string;
      referenceNumber: string;
      transactionUrl: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">Transaction Successful ✓</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Your transaction has been successfully completed and is now on the blockchain.
      </p>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0;">Amount:</td>
            <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right; padding: 8px 0;">${data.amount} USDC</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0;">Recipient:</td>
            <td style="color: #333; font-size: 14px; text-align: right; padding: 8px 0;">${data.recipient}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0;">Reference:</td>
            <td style="color: #667eea; font-size: 14px; font-family: monospace; text-align: right; padding: 8px 0;">${data.referenceNumber}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0; border-top: 1px solid #dee2e6; padding-top: 12px;">Transaction Hash:</td>
            <td style="color: #667eea; font-size: 12px; font-family: monospace; text-align: right; word-break: break-all; padding: 8px 0; border-top: 1px solid #dee2e6; padding-top: 12px;">${data.transactionHash}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.transactionUrl}" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
          View Transaction
        </a>
        <a href="https://basescan.org/tx/${data.transactionHash}" style="background-color: #6c757d; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View on BaseScan
        </a>
      </div>

      <p style="color: #6c757d; font-size: 13px; line-height: 1.6; margin-top: 30px;">
        This transaction was sponsored with gasless technology, so you paid zero gas fees! 🎉
      </p>
    `;

    return this.sendEmail({
      to,
      subject: `Transaction Confirmed - ${data.amount} USDC Sent`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send transaction receipt
   */
  static async sendTransactionReceipt(
    to: string,
    data: {
      userName: string;
      amount: string;
      sender: string;
      transactionHash: string;
      referenceNumber: string;
      transactionUrl: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">Payment Received! 💸</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        You've received a payment on Maya Global Pay. The funds have been added to your wallet.
      </p>

      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Amount Received</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold;">+${data.amount} USDC</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0;">From:</td>
            <td style="color: #333; font-size: 14px; text-align: right; padding: 8px 0;">${data.sender}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0;">Reference:</td>
            <td style="color: #667eea; font-size: 14px; font-family: monospace; text-align: right; padding: 8px 0;">${data.referenceNumber}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px; padding: 8px 0; border-top: 1px solid #dee2e6; padding-top: 12px;">Transaction Hash:</td>
            <td style="color: #667eea; font-size: 12px; font-family: monospace; text-align: right; word-break: break-all; padding: 8px 0; border-top: 1px solid #dee2e6; padding-top: 12px;">${data.transactionHash}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.transactionUrl}" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Transaction Details
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Payment Received - ${data.amount} USDC`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send transaction failed notification
   */
  static async sendTransactionFailed(
    to: string,
    data: {
      userName: string;
      amount: string;
      reason: string;
      referenceNumber: string;
    }
  ) {
    const content = `
      <h2 style="color: #dc3545; margin: 0 0 20px 0;">Transaction Failed ✗</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Unfortunately, your transaction could not be completed. The funds have been returned to your wallet.
      </p>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #721c24; font-size: 14px;"><strong>Transaction Details:</strong></p>
        <p style="margin: 5px 0; color: #721c24; font-size: 14px;">Amount: <strong>${data.amount} USDC</strong></p>
        <p style="margin: 5px 0; color: #721c24; font-size: 14px;">Reference: <strong>${data.referenceNumber}</strong></p>
        <p style="margin: 15px 0 5px 0; color: #721c24; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 0; color: #721c24; font-size: 14px;">${data.reason}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        If you continue to experience issues, please contact our support team for assistance.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_URL}/support" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Contact Support
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Transaction Failed - Action Required',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send KYC submitted confirmation
   */
  static async sendKYCSubmitted(
    to: string,
    data: {
      userName: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">KYC Documents Received ✓</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Thank you for submitting your KYC verification documents. We've received them and our team is now reviewing your submission.
      </p>

      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460; font-size: 14px;">
          📋 <strong>What's Next?</strong><br><br>
          Our compliance team typically reviews submissions within 24-48 hours. You'll receive an email once your verification is complete.
        </p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        In the meantime, you can still use your account with basic features.
      </p>
    `;

    return this.sendEmail({
      to,
      subject: 'KYC Documents Received - Under Review',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send KYC approved notification
   */
  static async sendKYCApproved(
    to: string,
    data: {
      userName: string;
      tier: string;
    }
  ) {
    const content = `
      <h2 style="color: #28a745; margin: 0 0 20px 0;">KYC Verification Approved! 🎉</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Great news! Your KYC verification for <strong>${data.tier.toUpperCase()}</strong> has been approved.
      </p>

      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0; font-size: 48px;">✓</p>
        <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">Verification Complete</p>
      </div>

      <h3 style="color: #333; margin: 25px 0 15px 0; font-size: 18px;">You can now:</h3>
      <ul style="color: #555; font-size: 15px; line-height: 1.8; padding-left: 20px;">
        <li>Send and receive unlimited USDC payments</li>
        <li>Access escrow services for secure transactions</li>
        <li>Request virtual and physical cards</li>
        <li>Enjoy higher transaction limits</li>
      </ul>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${env.FRONTEND_URL}/dashboard" style="background-color: #28a745; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 15px;">
          Start Using Your Account
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'KYC Approved - Full Access Granted! 🎉',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send KYC rejected notification
   */
  static async sendKYCRejected(
    to: string,
    data: {
      userName: string;
      reason: string;
      resubmitUrl: string;
    }
  ) {
    const content = `
      <h2 style="color: #dc3545; margin: 0 0 20px 0;">KYC Verification - Additional Information Required</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        We've reviewed your KYC submission and need some additional information to complete your verification.
      </p>

      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #721c24; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 0; color: #721c24; font-size: 14px;">${data.reason}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Don't worry! You can resubmit your documents by clicking the button below.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resubmitUrl}" style="background-color: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Resubmit Documents
        </a>
      </div>

      <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
        Need help? Our support team is here to guide you through the verification process.
      </p>
    `;

    return this.sendEmail({
      to,
      subject: 'KYC Verification - Additional Information Needed',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send escrow created notification
   */
  static async sendEscrowCreated(
    to: string,
    data: {
      userName: string;
      amount: string;
      recipient: string;
      referenceNumber: string;
      escrowUrl: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">Escrow Created 🔒</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Your escrow has been created successfully. The funds are now securely held until you release them.
      </p>

      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr>
            <td style="color: #6c757d; font-size: 14px;">Amount:</td>
            <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right;">${data.amount} USDC</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px;">Recipient:</td>
            <td style="color: #333; font-size: 14px; text-align: right;">${data.recipient}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; font-size: 14px;">Reference:</td>
            <td style="color: #667eea; font-size: 14px; font-family: monospace; text-align: right;">${data.referenceNumber}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460; font-size: 14px;">
          🔒 Your funds are safely held in escrow. You can release them once the terms are met, or open a dispute if there's an issue.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.escrowUrl}" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Escrow Details
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Escrow Created - ${data.amount} USDC`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send escrow received notification
   */
  static async sendEscrowReceived(
    to: string,
    data: {
      userName: string;
      amount: string;
      sender: string;
      description: string;
      referenceNumber: string;
      escrowUrl: string;
    }
  ) {
    const content = `
      <h2 style="color: #333; margin: 0 0 20px 0;">Escrow Payment Pending 📦</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        <strong>${data.sender}</strong> has created an escrow payment for you. The funds will be released once the agreed terms are met.
      </p>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Escrow Amount</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold;">${data.amount} USDC</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;"><strong>Description:</strong></p>
        <p style="margin: 0; color: #555; font-size: 14px;">${data.description}</p>
        <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 13px;">Reference: ${data.referenceNumber}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Complete the agreed work or service, and the buyer will release the funds to you.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.escrowUrl}" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Escrow Details
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `New Escrow Payment - ${data.amount} USDC`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send escrow released notification
   */
  static async sendEscrowReleased(
    to: string,
    data: {
      userName: string;
      amount: string;
      recipient: string;
      referenceNumber: string;
    }
  ) {
    const content = `
      <h2 style="color: #28a745; margin: 0 0 20px 0;">Escrow Funds Released ✓</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        You have successfully released the escrow funds to <strong>${data.recipient}</strong>.
      </p>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724; font-size: 14px;">
          ✓ <strong>${data.amount} USDC</strong> has been transferred to the recipient's wallet.<br>
          Reference: <strong>${data.referenceNumber}</strong>
        </p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Thank you for using Maya Global Pay's escrow service for secure transactions!
      </p>
    `;

    return this.sendEmail({
      to,
      subject: 'Escrow Funds Released Successfully',
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send escrow completed notification
   */
  static async sendEscrowCompleted(
    to: string,
    data: {
      userName: string;
      amount: string;
      sender: string;
      referenceNumber: string;
    }
  ) {
    const content = `
      <h2 style="color: #28a745; margin: 0 0 20px 0;">Escrow Payment Received! 🎉</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Great news! The escrow funds from <strong>${data.sender}</strong> have been released and added to your wallet.
      </p>

      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.9;">Amount Received</p>
        <p style="margin: 0; font-size: 36px; font-weight: bold;">+${data.amount} USDC</p>
      </div>

      <p style="color: #6c757d; font-size: 14px; line-height: 1.6;">
        Reference: ${data.referenceNumber}
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_URL}/wallet" style="background-color: #28a745; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Wallet Balance
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Escrow Payment Received - ${data.amount} USDC`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send dispute opened notification
   */
  static async sendDisputeOpened(
    to: string,
    data: {
      userName: string;
      amount: string;
      referenceNumber: string;
      disputeReason: string;
    }
  ) {
    const content = `
      <h2 style="color: #ffc107; margin: 0 0 20px 0;">Dispute Opened ⚠️</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Your dispute for escrow <strong>${data.referenceNumber}</strong> has been submitted successfully.
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px;"><strong>Dispute Details:</strong></p>
        <p style="margin: 5px 0; color: #856404; font-size: 14px;">Amount: <strong>${data.amount} USDC</strong></p>
        <p style="margin: 5px 0; color: #856404; font-size: 14px;">Reference: <strong>${data.referenceNumber}</strong></p>
        <p style="margin: 15px 0 5px 0; color: #856404; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="margin: 0; color: #856404; font-size: 14px;">${data.disputeReason}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Our support team will review your dispute and both parties' evidence. You'll receive an update within 3-5 business days.
      </p>

      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460; font-size: 14px;">
          💡 <strong>Tip:</strong> The escrow funds remain locked during the dispute resolution process to ensure fairness for both parties.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Dispute Opened - ${data.referenceNumber}`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send dispute notification to other party
   */
  static async sendDisputeNotification(
    to: string,
    data: {
      userName: string;
      amount: string;
      referenceNumber: string;
      disputeReason: string;
    }
  ) {
    const content = `
      <h2 style="color: #ffc107; margin: 0 0 20px 0;">Dispute Notification ⚠️</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        A dispute has been opened for escrow <strong>${data.referenceNumber}</strong> by the other party.
      </p>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #856404; font-size: 14px;"><strong>Dispute Details:</strong></p>
        <p style="margin: 5px 0; color: #856404; font-size: 14px;">Amount: <strong>${data.amount} USDC</strong></p>
        <p style="margin: 5px 0; color: #856404; font-size: 14px;">Reference: <strong>${data.referenceNumber}</strong></p>
        <p style="margin: 15px 0 5px 0; color: #856404; font-size: 14px;"><strong>Reason Given:</strong></p>
        <p style="margin: 0; color: #856404; font-size: 14px;">${data.disputeReason}</p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        You can provide additional evidence or respond to this dispute by logging into your account. Our support team will review all information from both parties before making a decision.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_URL}/escrow/${data.referenceNumber}" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Dispute Details
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Dispute Opened - ${data.referenceNumber}`,
      html: this.getEmailTemplate(content),
    });
  }

  /**
   * Send dispute resolved notification
   */
  static async sendDisputeResolved(
    to: string,
    data: {
      userName: string;
      amount: string;
      resolution: 'buyer' | 'seller' | 'split';
      resolutionNotes?: string;
      referenceNumber: string;
    }
  ) {
    const resolutionText =
      data.resolution === 'buyer'
        ? 'in favor of the buyer (full refund)'
        : data.resolution === 'seller'
        ? 'in favor of the seller (full payment)'
        : '50/50 split between both parties';

    const content = `
      <h2 style="color: #28a745; margin: 0 0 20px 0;">Dispute Resolved ✓</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">Hi ${data.userName},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        The dispute for escrow <strong>${data.referenceNumber}</strong> has been resolved.
      </p>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <p style="margin: 0 0 10px 0; color: #155724; font-size: 14px;"><strong>Resolution:</strong></p>
        <p style="margin: 0; color: #155724; font-size: 14px;">
          The dispute was resolved <strong>${resolutionText}</strong>.
        </p>
      </div>

      ${
        data.resolutionNotes
          ? `
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;"><strong>Resolution Notes:</strong></p>
        <p style="margin: 0; color: #555; font-size: 14px;">${data.resolutionNotes}</p>
      </div>
      `
          : ''
      }

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        The funds have been distributed according to this resolution. You can view the final transaction in your account.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${env.FRONTEND_URL}/dashboard" style="background-color: #667eea; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Dispute Resolved - ${data.referenceNumber}`,
      html: this.getEmailTemplate(content),
    });
  }
}

export default EmailService;
