import { prisma } from '../config/database';
import { redis } from '../config/redis';

// Setup before all tests
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();

  // Connect to Redis
  await redis.ping();
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();

  // Disconnect from Redis
  await redis.quit();
});

// Clear database before each test
beforeEach(async () => {
  // Truncate tables in reverse order of dependencies
  const tablenames = [
    'audit_logs',
    'notifications',
    'support_ticket_messages',
    'support_tickets',
    'generated_reports',
    'scheduled_reports',
    'referrals',
    'rate_limit_violations',
    'fraud_alerts',
    'email_payments',
    'disputes',
    'card_transactions',
    'cards',
    'withdrawals',
    'kyc_submissions',
    'escrows',
    'money_requests',
    'recipients',
    'transactions',
    'wallets',
    'user_preferences',
    'user_roles',
    'users',
    'system_settings',
  ];

  for (const tablename of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
  }

  // Clear Redis
  await redis.flushdb();
});

// Export test utilities
export const createTestUser = async (data?: Partial<any>) => {
  return prisma.user.create({
    data: {
      web3authId: data?.web3authId || 'test-web3auth-id',
      walletAddress: data?.walletAddress || '0x1234567890123456789012345678901234567890',
      email: data?.email || 'test@example.com',
      fullName: data?.fullName || 'Test User',
      ...data,
    },
  });
};

export const createTestTransaction = async (senderId: string, data?: Partial<any>) => {
  return prisma.transaction.create({
    data: {
      senderId,
      senderWallet: '0x1234567890123456789012345678901234567890',
      recipientWallet: '0x0987654321098765432109876543210987654321',
      amountUsdc: data?.amountUsdc || 100,
      feeUsdc: data?.feeUsdc || 0.5,
      transactionType: data?.transactionType || 'send',
      status: data?.status || 'pending',
      chain: 'base',
      network: 'testnet',
      referenceNumber: data?.referenceNumber || 'TXN-TEST-123',
      ...data,
    },
  });
};

export default {
  createTestUser,
  createTestTransaction,
};
