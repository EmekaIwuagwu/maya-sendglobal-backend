import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = env.ENCRYPTION_ALGORITHM;
const ENCRYPTION_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

export class EncryptionService {
  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = (cipher as crypto.CipherGCM).getAuthTag();

    // Combine IV + Auth Tag + Encrypted Data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    (decipher as crypto.DecipherGCM).setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash data (one-way)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate random code (numbers only)
   */
  static generateCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  /**
   * Mask sensitive information
   */
  static maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return '****';
    return '**** **** **** ' + cardNumber.slice(-4);
  }

  /**
   * Mask email
   */
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;

    const visibleChars = Math.min(3, username.length);
    const masked = username.slice(0, visibleChars) + '***';
    return `${masked}@${domain}`;
  }

  /**
   * Mask phone number
   */
  static maskPhone(phone: string): string {
    if (phone.length < 4) return '***';
    return '***' + phone.slice(-4);
  }

  /**
   * Mask account number
   */
  static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length < 4) return '****';
    return '****' + accountNumber.slice(-4);
  }
}

export default EncryptionService;
