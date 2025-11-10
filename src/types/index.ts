import { Request } from 'express';
import { AppRole } from '@prisma/client';

// Extend Express Request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    email?: string;
    roles: AppRole[];
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Blockchain Types
export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface PaymasterResponse {
  paymasterTxHash: string;
  sponsorAddress: string;
  gasEstimate: string;
  status: 'pending' | 'confirmed' | 'failed';
}

// Web3Auth Types
export interface Web3AuthPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  email?: string;
  name?: string;
  wallets: Array<{
    type: string;
    public_key: string;
    curve: string;
  }>;
}

// JWT Payload
export interface JwtPayload {
  userId: string;
  walletAddress: string;
  roles: AppRole[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

// Transaction Types
export interface CreateTransactionDto {
  recipientAddress?: string;
  recipientEmail?: string;
  amount: string;
  note?: string;
  type?: 'send' | 'deposit' | 'withdraw';
}

export interface TransactionFilter {
  userId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

// KYC Types
export interface KycSubmissionDto {
  tier: 'tier1' | 'tier2' | 'tier3';
  documentType: string;
  documentNumber?: string;
  documentCountry?: string;
  documentFront: File;
  documentBack?: File;
  selfie?: File;
  addressProof?: File;
}

// Card Types
export interface CreateCardDto {
  cardType: 'virtual' | 'physical';
  billingAddress: Address;
  shippingAddress?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Notification Types
export interface NotificationPayload {
  userId: string;
  type: string;
  channel: 'in_app' | 'email' | 'sms' | 'push';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}

// Email Types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
}

// SMS Types
export interface SmsOptions {
  to: string;
  message: string;
}

// File Upload Types
export interface FileUploadOptions {
  file: Express.Multer.File;
  folder: string;
  allowedTypes?: string[];
  maxSize?: number;
}

export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimetype: string;
}

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: string;
  revenue: string;
  pendingKyc: number;
  pendingWithdrawals: number;
  fraudAlerts: number;
}

export interface TransactionAnalytics {
  totalVolume: string;
  totalCount: number;
  avgTransactionSize: string;
  chartData: Array<{
    date: string;
    volume: string;
    count: number;
  }>;
  byType: Array<{
    type: string;
    volume: string;
    percentage: number;
  }>;
}

// Job Types
export interface JobData {
  type: string;
  data: Record<string, unknown>;
  userId?: string;
  priority?: number;
  attempts?: number;
}

// Audit Log Types
export interface AuditLogData {
  userId?: string;
  adminId?: string;
  action: string;
  actionCategory?: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Rate Limiting
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

// Query Filters
export interface QueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Webhook Types
export interface CircleWebhookPayload {
  eventType: string;
  transactionHash: string;
  paymasterTxHash?: string;
  status: string;
  gasUsed?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface Web3AuthWebhookPayload {
  eventType: string;
  userId: string;
  data: Record<string, unknown>;
}

export default {
  ApiResponse,
  Pagination,
  AuthenticatedRequest,
  JwtPayload,
  Web3AuthPayload,
};
