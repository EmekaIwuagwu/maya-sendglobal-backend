import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  // Server
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  CORS_ORIGIN: string[];

  // Database
  DATABASE_URL: string;

  // Redis
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  REDIS_TLS: boolean;

  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;

  // Web3Auth
  WEB3AUTH_CLIENT_ID: string;
  WEB3AUTH_CLIENT_SECRET: string;
  WEB3AUTH_VERIFIER_NAME: string;
  WEB3AUTH_NETWORK: string;
  WEB3AUTH_JWKS_URL: string;

  // Circle Paymaster
  CIRCLE_API_KEY: string;
  CIRCLE_API_URL: string;
  CIRCLE_PAYMASTER_ADDRESS: string;
  CIRCLE_WEBHOOK_SECRET: string;

  // Base Network
  BASE_RPC_URL_MAINNET: string;
  BASE_RPC_URL_TESTNET: string;
  BASE_CHAIN_ID_MAINNET: number;
  BASE_CHAIN_ID_TESTNET: number;
  USDC_CONTRACT_MAINNET: string;
  USDC_CONTRACT_TESTNET: string;
  DEFAULT_NETWORK: 'mainnet' | 'testnet';

  // Encryption
  ENCRYPTION_KEY: string;
  ENCRYPTION_ALGORITHM: string;

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;

  // SMTP Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  FROM_EMAIL: string;
  FROM_NAME: string;
  SUPPORT_EMAIL: string;

  // Paystack
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_WEBHOOK_SECRET: string;

  // SMS
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;

  // Monitoring
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT: string;
  LOG_LEVEL: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_AUTH: number;
  RATE_LIMIT_TRANSACTIONS: number;
  RATE_LIMIT_ADMIN: number;

  // Feature Flags
  ENABLE_CARDS: boolean;
  ENABLE_ESCROW: boolean;
  ENABLE_EMAIL_PAYMENTS: boolean;
  ENABLE_2FA: boolean;
  MAINTENANCE_MODE: boolean;

  // Transaction Limits
  DEFAULT_DAILY_LIMIT: number;
  DEFAULT_MONTHLY_LIMIT: number;
  DEFAULT_TRANSACTION_LIMIT: number;
  MIN_TRANSACTION_AMOUNT: number;

  // Fees
  TRANSACTION_FEE_PERCENT: number;
  WITHDRAWAL_FEE_PERCENT: number;
  CARD_ISSUANCE_FEE: number;
  CARD_MONTHLY_FEE: number;

  // URLs
  FRONTEND_URL: string;
  FRONTEND_URL_PROD: string;
  BACKEND_URL: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvBool = (key: string, defaultValue = 'false'): boolean => {
  return getEnv(key, defaultValue).toLowerCase() === 'true';
};

const getEnvNumber = (key: string, defaultValue?: string): number => {
  const value = parseFloat(getEnv(key, defaultValue));
  if (isNaN(value)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return value;
};

const getEnvArray = (key: string, defaultValue = ''): string[] => {
  return getEnv(key, defaultValue)
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

export const env: EnvironmentConfig = {
  // Server
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', '3000'),
  API_VERSION: getEnv('API_VERSION', 'v1'),
  CORS_ORIGIN: getEnvArray('CORS_ORIGIN', 'http://localhost:3000'),

  // Database
  DATABASE_URL: getEnv('DATABASE_URL'),

  // Redis
  REDIS_URL: getEnv('REDIS_URL'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_TLS: getEnvBool('REDIS_TLS', 'false'),

  // JWT
  JWT_SECRET: getEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRY: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  JWT_REFRESH_EXPIRY: getEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Web3Auth
  WEB3AUTH_CLIENT_ID: getEnv('WEB3AUTH_CLIENT_ID'),
  WEB3AUTH_CLIENT_SECRET: getEnv('WEB3AUTH_CLIENT_SECRET'),
  WEB3AUTH_VERIFIER_NAME: getEnv('WEB3AUTH_VERIFIER_NAME'),
  WEB3AUTH_NETWORK: getEnv('WEB3AUTH_NETWORK', 'testnet'),
  WEB3AUTH_JWKS_URL: getEnv('WEB3AUTH_JWKS_URL', 'https://api-auth.web3auth.io/jwks'),

  // Circle Paymaster
  CIRCLE_API_KEY: getEnv('CIRCLE_API_KEY'),
  CIRCLE_API_URL: getEnv('CIRCLE_API_URL', 'https://api.circle.com/v1/w3s'),
  CIRCLE_PAYMASTER_ADDRESS: getEnv('CIRCLE_PAYMASTER_ADDRESS'),
  CIRCLE_WEBHOOK_SECRET: getEnv('CIRCLE_WEBHOOK_SECRET'),

  // Base Network
  BASE_RPC_URL_MAINNET: getEnv('BASE_RPC_URL_MAINNET', 'https://mainnet.base.org'),
  BASE_RPC_URL_TESTNET: getEnv('BASE_RPC_URL_TESTNET', 'https://sepolia.base.org'),
  BASE_CHAIN_ID_MAINNET: getEnvNumber('BASE_CHAIN_ID_MAINNET', '8453'),
  BASE_CHAIN_ID_TESTNET: getEnvNumber('BASE_CHAIN_ID_TESTNET', '84532'),
  USDC_CONTRACT_MAINNET: getEnv(
    'USDC_CONTRACT_MAINNET',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  ),
  USDC_CONTRACT_TESTNET: getEnv(
    'USDC_CONTRACT_TESTNET',
    '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  ),
  DEFAULT_NETWORK: getEnv('DEFAULT_NETWORK', 'testnet') as 'mainnet' | 'testnet',

  // Encryption
  ENCRYPTION_KEY: getEnv('ENCRYPTION_KEY'),
  ENCRYPTION_ALGORITHM: getEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getEnv('CLOUDINARY_API_SECRET'),

  // SMTP Email
  SMTP_HOST: getEnv('SMTP_HOST'),
  SMTP_PORT: getEnvNumber('SMTP_PORT', '587'),
  SMTP_SECURE: getEnvBool('SMTP_SECURE', 'false'),
  SMTP_USER: getEnv('SMTP_USER'),
  SMTP_PASSWORD: getEnv('SMTP_PASSWORD'),
  FROM_EMAIL: getEnv('FROM_EMAIL'),
  FROM_NAME: getEnv('FROM_NAME', 'Maya Global Pay'),
  SUPPORT_EMAIL: getEnv('SUPPORT_EMAIL'),

  // Paystack
  PAYSTACK_SECRET_KEY: getEnv('PAYSTACK_SECRET_KEY'),
  PAYSTACK_PUBLIC_KEY: getEnv('PAYSTACK_PUBLIC_KEY'),
  PAYSTACK_WEBHOOK_SECRET: getEnv('PAYSTACK_WEBHOOK_SECRET'),

  // SMS
  TWILIO_ACCOUNT_SID: getEnv('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: getEnv('TWILIO_PHONE_NUMBER'),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENVIRONMENT: getEnv('SENTRY_ENVIRONMENT', 'development'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW: getEnvNumber('RATE_LIMIT_WINDOW', '60'),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', '100'),
  RATE_LIMIT_AUTH: getEnvNumber('RATE_LIMIT_AUTH', '5'),
  RATE_LIMIT_TRANSACTIONS: getEnvNumber('RATE_LIMIT_TRANSACTIONS', '10'),
  RATE_LIMIT_ADMIN: getEnvNumber('RATE_LIMIT_ADMIN', '200'),

  // Feature Flags
  ENABLE_CARDS: getEnvBool('ENABLE_CARDS', 'true'),
  ENABLE_ESCROW: getEnvBool('ENABLE_ESCROW', 'true'),
  ENABLE_EMAIL_PAYMENTS: getEnvBool('ENABLE_EMAIL_PAYMENTS', 'true'),
  ENABLE_2FA: getEnvBool('ENABLE_2FA', 'true'),
  MAINTENANCE_MODE: getEnvBool('MAINTENANCE_MODE', 'false'),

  // Transaction Limits
  DEFAULT_DAILY_LIMIT: getEnvNumber('DEFAULT_DAILY_LIMIT', '10000'),
  DEFAULT_MONTHLY_LIMIT: getEnvNumber('DEFAULT_MONTHLY_LIMIT', '50000'),
  DEFAULT_TRANSACTION_LIMIT: getEnvNumber('DEFAULT_TRANSACTION_LIMIT', '5000'),
  MIN_TRANSACTION_AMOUNT: getEnvNumber('MIN_TRANSACTION_AMOUNT', '1'),

  // Fees
  TRANSACTION_FEE_PERCENT: getEnvNumber('TRANSACTION_FEE_PERCENT', '0.5'),
  WITHDRAWAL_FEE_PERCENT: getEnvNumber('WITHDRAWAL_FEE_PERCENT', '1'),
  CARD_ISSUANCE_FEE: getEnvNumber('CARD_ISSUANCE_FEE', '5'),
  CARD_MONTHLY_FEE: getEnvNumber('CARD_MONTHLY_FEE', '2'),

  // URLs
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:3001'),
  FRONTEND_URL_PROD: getEnv('FRONTEND_URL_PROD', 'https://www.mayaglobal.com'),
  BACKEND_URL: getEnv('BACKEND_URL', 'http://localhost:3000'),
};

export default env;
