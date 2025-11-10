import twilio from 'twilio';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { SmsOptions } from '../types';

export class SmsService {
  private static client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  private static FROM_NUMBER = env.TWILIO_PHONE_NUMBER;

  /**
   * Send SMS using Twilio
   */
  static async sendSms(options: SmsOptions): Promise<boolean> {
    try {
      await this.client.messages.create({
        body: options.message,
        from: this.FROM_NUMBER,
        to: options.to,
      });

      logger.info(`SMS sent to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Send 2FA code via SMS
   */
  static async send2FACode(phoneNumber: string, code: string) {
    return this.sendSms({
      to: phoneNumber,
      message: `Your Maya Global Pay verification code is: ${code}. This code will expire in 10 minutes.`,
    });
  }

  /**
   * Send transaction alert via SMS
   */
  static async sendTransactionAlert(phoneNumber: string, amount: string, type: string) {
    return this.sendSms({
      to: phoneNumber,
      message: `Maya Global Pay: ${type} transaction of ${amount} USDC has been processed. If you didn't authorize this, contact support immediately.`,
    });
  }

  /**
   * Send security alert via SMS
   */
  static async sendSecurityAlert(phoneNumber: string, alert: string) {
    return this.sendSms({
      to: phoneNumber,
      message: `Maya Global Pay Security Alert: ${alert}. If this wasn't you, secure your account immediately.`,
    });
  }

  /**
   * Send phone verification code
   */
  static async sendVerificationCode(phoneNumber: string, code: string) {
    return this.sendSms({
      to: phoneNumber,
      message: `Your Maya Global Pay phone verification code is: ${code}. Valid for 10 minutes.`,
    });
  }
}

export default SmsService;
