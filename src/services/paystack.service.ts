import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import crypto from 'crypto';

export class PaystackService {
  private static readonly API_URL = 'https://api.paystack.co';
  private static readonly SECRET_KEY = env.PAYSTACK_SECRET_KEY;

  private static get headers() {
    return {
      Authorization: `Bearer ${this.SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize transaction
   */
  static async initializeTransaction(data: {
    email: string;
    amount: number; // Amount in kobo (NGN * 100)
    reference?: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(
        `${this.API_URL}/transaction/initialize`,
        {
          email: data.email,
          amount: data.amount,
          reference: data.reference || this.generateReference(),
          callback_url: data.callback_url,
          metadata: data.metadata,
          currency: 'NGN',
        },
        { headers: this.headers }
      );

      logger.info(`Paystack transaction initialized: ${response.data.data.reference}`);

      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    } catch (error) {
      logger.error('Paystack initialize transaction error:', error);
      throw error;
    }
  }

  /**
   * Verify transaction
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/transaction/verify/${reference}`,
        { headers: this.headers }
      );

      const data = response.data.data;

      logger.info(`Paystack transaction verified: ${reference}`);

      return {
        success: data.status === 'success',
        amount: data.amount / 100, // Convert from kobo to NGN
        currency: data.currency,
        reference: data.reference,
        status: data.status,
        paidAt: data.paid_at,
        customer: {
          email: data.customer.email,
          customerCode: data.customer.customer_code,
        },
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error('Paystack verify transaction error:', error);
      throw error;
    }
  }

  /**
   * Create virtual card (Paystack Issuing)
   */
  static async createVirtualCard(data: {
    userId: string;
    amount: number;
    currency?: string;
  }) {
    try {
      // Note: This requires Paystack Issuing API access
      const response = await axios.post(
        `${this.API_URL}/issuing/card`,
        {
          type: 'virtual',
          amount: data.amount * 100, // Convert to kobo
          currency: data.currency || 'NGN',
          metadata: {
            user_id: data.userId,
          },
        },
        { headers: this.headers }
      );

      logger.info(`Virtual card created via Paystack: ${response.data.data.id}`);

      return {
        success: true,
        cardId: response.data.data.id,
        maskedPan: response.data.data.masked_pan,
        expiryMonth: response.data.data.expiry_month,
        expiryYear: response.data.data.expiry_year,
        cvv: response.data.data.cvv,
        brand: response.data.data.brand,
      };
    } catch (error) {
      logger.error('Paystack create card error:', error);
      throw error;
    }
  }

  /**
   * Fund virtual card
   */
  static async fundCard(cardId: string, amount: number) {
    try {
      const response = await axios.post(
        `${this.API_URL}/issuing/card/${cardId}/fund`,
        {
          amount: amount * 100, // Convert to kobo
        },
        { headers: this.headers }
      );

      logger.info(`Card funded via Paystack: ${cardId}`);

      return {
        success: true,
        balance: response.data.data.balance / 100,
      };
    } catch (error) {
      logger.error('Paystack fund card error:', error);
      throw error;
    }
  }

  /**
   * Get card details
   */
  static async getCardDetails(cardId: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/issuing/card/${cardId}`,
        { headers: this.headers }
      );

      return {
        success: true,
        card: {
          id: response.data.data.id,
          maskedPan: response.data.data.masked_pan,
          expiryMonth: response.data.data.expiry_month,
          expiryYear: response.data.data.expiry_year,
          brand: response.data.data.brand,
          balance: response.data.data.balance / 100,
          status: response.data.data.status,
        },
      };
    } catch (error) {
      logger.error('Paystack get card details error:', error);
      throw error;
    }
  }

  /**
   * Freeze/Unfreeze card
   */
  static async toggleCardStatus(cardId: string, action: 'freeze' | 'unfreeze') {
    try {
      const response = await axios.post(
        `${this.API_URL}/issuing/card/${cardId}/${action}`,
        {},
        { headers: this.headers }
      );

      logger.info(`Card ${action}d via Paystack: ${cardId}`);

      return {
        success: true,
        status: response.data.data.status,
      };
    } catch (error) {
      logger.error(`Paystack ${action} card error:`, error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.SECRET_KEY)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Generate unique reference
   */
  static generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MGP-${timestamp}-${random}`;
  }

  /**
   * Get banks list (for transfers)
   */
  static async getBanksList() {
    try {
      const response = await axios.get(
        `${this.API_URL}/bank`,
        { headers: this.headers }
      );

      return {
        success: true,
        banks: response.data.data.map((bank: any) => ({
          id: bank.id,
          name: bank.name,
          code: bank.code,
        })),
      };
    } catch (error) {
      logger.error('Paystack get banks error:', error);
      throw error;
    }
  }

  /**
   * Resolve account number
   */
  static async resolveAccountNumber(accountNumber: string, bankCode: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.headers }
      );

      return {
        success: true,
        accountNumber: response.data.data.account_number,
        accountName: response.data.data.account_name,
        bankId: response.data.data.bank_id,
      };
    } catch (error) {
      logger.error('Paystack resolve account error:', error);
      throw error;
    }
  }
}

export default PaystackService;
