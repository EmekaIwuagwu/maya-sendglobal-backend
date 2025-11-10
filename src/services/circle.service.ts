import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../utils/error-codes';
import { PaymasterResponse } from '../types';
import { retryWithBackoff } from '../utils/helpers';

export class CircleService {
  private static readonly API_URL = env.CIRCLE_API_URL;
  private static readonly API_KEY = env.CIRCLE_API_KEY;

  private static get headers() {
    return {
      Authorization: `Bearer ${this.API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Sponsor a transaction with Circle Paymaster
   */
  static async sponsorTransaction(data: {
    chainId: number;
    from: string;
    to: string;
    data: string;
    value?: string;
  }): Promise<PaymasterResponse> {
    try {
      const response = await retryWithBackoff(async () => {
        return await axios.post(
          `${this.API_URL}/paymaster/sponsor`,
          {
            chainId: data.chainId,
            transaction: {
              from: data.from,
              to: data.to,
              data: data.data,
              value: data.value || '0',
            },
          },
          { headers: this.headers }
        );
      });

      const result = response.data;

      return {
        paymasterTxHash: result.paymasterTxHash,
        sponsorAddress: result.sponsorAddress,
        gasEstimate: result.gasEstimate,
        status: result.status,
      };
    } catch (error) {
      logger.error('Circle Paymaster error:', error);
      throw new AppError('TXN_006', 500);
    }
  }

  /**
   * Get transaction status from Circle
   */
  static async getTransactionStatus(txHash: string) {
    try {
      const response = await axios.get(`${this.API_URL}/paymaster/transactions/${txHash}`, {
        headers: this.headers,
      });

      return response.data;
    } catch (error) {
      logger.error('Error getting Circle transaction status:', error);
      return null;
    }
  }

  /**
   * Verify Circle webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');

    const expectedSignature = crypto
      .createHmac('sha256', env.CIRCLE_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Get gas estimate from Circle
   */
  static async getGasEstimate(data: {
    chainId: number;
    from: string;
    to: string;
    data: string;
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.API_URL}/paymaster/estimate`,
        {
          chainId: data.chainId,
          transaction: {
            from: data.from,
            to: data.to,
            data: data.data,
          },
        },
        { headers: this.headers }
      );

      return response.data.gasEstimate;
    } catch (error) {
      logger.error('Error getting gas estimate from Circle:', error);
      throw new AppError('TXN_013', 500);
    }
  }
}

export default CircleService;
