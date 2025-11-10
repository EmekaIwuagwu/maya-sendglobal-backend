export const ERROR_CODES = {
  // Authentication (AUTH_XXX)
  AUTH_001: 'Invalid credentials',
  AUTH_002: 'Token expired',
  AUTH_003: 'Unauthorized access',
  AUTH_004: 'Web3Auth validation failed',
  AUTH_005: '2FA required',
  AUTH_006: '2FA code invalid',
  AUTH_007: 'Account locked',
  AUTH_008: 'Invalid or missing token',
  AUTH_009: 'Refresh token expired',
  AUTH_010: 'Session not found',

  // User (USER_XXX)
  USER_001: 'User not found',
  USER_002: 'Account suspended',
  USER_003: 'Account frozen',
  USER_004: 'KYC required',
  USER_005: 'KYC pending',
  USER_006: 'Email not verified',
  USER_007: 'Phone not verified',
  USER_008: 'User already exists',
  USER_009: 'Invalid user status',
  USER_010: 'Profile update failed',

  // Transactions (TXN_XXX)
  TXN_001: 'Insufficient balance',
  TXN_002: 'Transaction limit exceeded',
  TXN_003: 'Daily limit exceeded',
  TXN_004: 'Invalid recipient',
  TXN_005: 'Transaction failed',
  TXN_006: 'Paymaster rejection',
  TXN_007: 'Transaction already processed',
  TXN_008: 'Minimum amount not met',
  TXN_009: 'Maximum amount exceeded',
  TXN_010: 'Transaction not found',
  TXN_011: 'Cannot cancel transaction',
  TXN_012: 'Invalid transaction status',
  TXN_013: 'Blockchain error',

  // Cards (CARD_XXX)
  CARD_001: 'Card not found',
  CARD_002: 'Card inactive',
  CARD_003: 'Card frozen',
  CARD_004: 'Insufficient card balance',
  CARD_005: 'Card limit exceeded',
  CARD_006: 'Card expired',
  CARD_007: 'Invalid PIN',
  CARD_008: 'Card issuing failed',
  CARD_009: 'Card already activated',
  CARD_010: 'Card cannot be cancelled',
  CARD_011: 'Daily spending limit exceeded',
  CARD_012: 'Monthly spending limit exceeded',

  // Escrow (ESCROW_XXX)
  ESCROW_001: 'Escrow not found',
  ESCROW_002: 'Unauthorized release',
  ESCROW_003: 'Already disputed',
  ESCROW_004: 'Escrow already released',
  ESCROW_005: 'Escrow locked',
  ESCROW_006: 'Cannot cancel escrow',
  ESCROW_007: 'Invalid escrow status',

  // KYC (KYC_XXX)
  KYC_001: 'Invalid document',
  KYC_002: 'Document upload failed',
  KYC_003: 'Already submitted',
  KYC_004: 'Tier not eligible',
  KYC_005: 'Document expired',
  KYC_006: 'Submission not found',
  KYC_007: 'KYC already approved',
  KYC_008: 'Document size too large',
  KYC_009: 'Invalid document type',

  // Withdrawals (WD_XXX)
  WD_001: 'Minimum amount not met',
  WD_002: 'Daily limit exceeded',
  WD_003: 'Invalid destination',
  WD_004: 'Withdrawal pending',
  WD_005: 'Insufficient balance',
  WD_006: 'Withdrawal not found',
  WD_007: 'Cannot cancel withdrawal',
  WD_008: 'Withdrawal already processed',
  WD_009: 'Invalid withdrawal method',

  // Disputes (DISP_XXX)
  DISP_001: 'Dispute not found',
  DISP_002: 'Dispute already resolved',
  DISP_003: 'Evidence required',
  DISP_004: 'Cannot dispute transaction',
  DISP_005: 'Dispute period expired',
  DISP_006: 'Invalid dispute type',

  // Email Payments (EMAIL_XXX)
  EMAIL_001: 'Email payment not found',
  EMAIL_002: 'Invalid claim code',
  EMAIL_003: 'Payment already claimed',
  EMAIL_004: 'Payment expired',
  EMAIL_005: 'Payment cancelled',
  EMAIL_006: 'Cannot cancel payment',

  // Money Requests (REQ_XXX)
  REQ_001: 'Request not found',
  REQ_002: 'Request expired',
  REQ_003: 'Request already paid',
  REQ_004: 'Cannot cancel request',
  REQ_005: 'Invalid request status',

  // Support (SUP_XXX)
  SUP_001: 'Ticket not found',
  SUP_002: 'Cannot update closed ticket',
  SUP_003: 'Invalid ticket status',
  SUP_004: 'Attachment upload failed',

  // Admin (ADMIN_XXX)
  ADMIN_001: 'Admin access required',
  ADMIN_002: 'Insufficient permissions',
  ADMIN_003: 'Action not allowed',
  ADMIN_004: 'Cannot modify super admin',
  ADMIN_005: 'Role assignment failed',

  // System (SYS_XXX)
  SYS_001: 'Internal server error',
  SYS_002: 'Service unavailable',
  SYS_003: 'Rate limit exceeded',
  SYS_004: 'Maintenance mode',
  SYS_005: 'Database error',
  SYS_006: 'Invalid request',
  SYS_007: 'Validation error',
  SYS_008: 'External service error',
  SYS_009: 'File upload error',
  SYS_010: 'Encryption error',

  // Wallet (WALLET_XXX)
  WALLET_001: 'Wallet not found',
  WALLET_002: 'Invalid wallet address',
  WALLET_003: 'Wallet already exists',
  WALLET_004: 'Cannot delete primary wallet',

  // Recipients (REC_XXX)
  REC_001: 'Recipient not found',
  REC_002: 'Invalid recipient data',
  REC_003: 'Recipient already exists',

  // Referrals (REF_XXX)
  REF_001: 'Invalid referral code',
  REF_002: 'Cannot refer yourself',
  REF_003: 'Referral already used',

  // Notifications (NOTIF_XXX)
  NOTIF_001: 'Notification not found',
  NOTIF_002: 'Failed to send notification',

  // Fraud (FRAUD_XXX)
  FRAUD_001: 'Suspicious activity detected',
  FRAUD_002: 'Account flagged for review',
  FRAUD_003: 'Transaction blocked by fraud detection',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number = 400,
    public isOperational: boolean = true,
    public data?: unknown
  ) {
    super(ERROR_CODES[code]);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ERROR_CODES;
