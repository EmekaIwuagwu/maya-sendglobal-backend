import { Decimal } from '@prisma/client/runtime/library';
import { Pagination, QueryFilters } from '../types';

/**
 * Generate unique reference number
 */
export function generateReferenceNumber(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate unique ticket number
 */
export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TICKET-${timestamp}-${random}`;
}

/**
 * Convert Decimal to string
 */
export function decimalToString(value: Decimal | null | undefined): string {
  if (!value) return '0.00';
  return value.toString();
}

/**
 * Convert string to Decimal
 */
export function stringToDecimal(value: string): Decimal {
  return new Decimal(value);
}

/**
 * Format currency (USDC)
 */
export function formatCurrency(amount: string | number | Decimal): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
}

/**
 * Calculate fee percentage
 */
export function calculateFee(amount: string | Decimal, feePercent: number): string {
  const amountNum = typeof amount === 'string' ? new Decimal(amount) : amount;
  const fee = amountNum.mul(feePercent).div(100);
  return fee.toFixed(6);
}

/**
 * Validate wallet address (Ethereum format)
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Generate pagination metadata
 */
export function getPaginationMetadata(
  total: number,
  page: number,
  limit: number
): Pagination {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse query filters
 */
export function parseQueryFilters(query: Record<string, unknown>): QueryFilters {
  return {
    page: query.page ? parseInt(query.page as string, 10) : 1,
    limit: query.limit ? parseInt(query.limit as string, 10) : 20,
    sortBy: (query.sortBy as string) || 'createdAt',
    sortOrder: (query.sortOrder as 'asc' | 'desc') || 'desc',
    search: query.search as string,
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate random alphanumeric string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date): boolean {
  return new Date() > date;
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format date to string
 */
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
}

/**
 * Truncate string
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Remove undefined/null values from object
 */
export function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  ) as Partial<T>;
}

export default {
  generateReferenceNumber,
  generateTicketNumber,
  decimalToString,
  stringToDecimal,
  formatCurrency,
  calculateFee,
  isValidWalletAddress,
  isValidEmail,
  isValidPhone,
  getPaginationMetadata,
  parseQueryFilters,
  sanitizeInput,
  generateRandomString,
  sleep,
  retryWithBackoff,
  isExpired,
  addDays,
  formatDate,
  truncate,
  deepClone,
  removeEmpty,
};
