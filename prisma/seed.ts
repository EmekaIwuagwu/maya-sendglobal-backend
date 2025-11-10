import { PrismaClient } from '@prisma/client';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seed...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mayaglobalpay.com' },
    update: {},
    create: {
      web3authId: 'admin-web3auth-id',
      walletAddress: '0xADMIN1234567890123456789012345678901234',
      email: 'admin@mayaglobalpay.com',
      emailVerified: true,
      fullName: 'Admin User',
      accountStatus: 'active',
      kycStatus: 'approved',
      kycTier: 'tier3',
      balanceUsdc: 0,
      roles: {
        create: [
          { role: 'user' },
          { role: 'admin' },
          { role: 'super_admin' },
        ],
      },
      wallets: {
        create: {
          walletAddress: '0xADMIN1234567890123456789012345678901234',
          walletType: 'embedded',
          chain: 'base',
          network: 'testnet',
          isPrimary: true,
        },
      },
      preferences: {
        create: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
        },
      },
    },
  });

  logger.info(`Admin user created: ${adminUser.id}`);

  // Create test users
  const testUser1 = await prisma.user.upsert({
    where: { email: 'user1@test.com' },
    update: {},
    create: {
      web3authId: 'test-user-1',
      walletAddress: '0x1111111111111111111111111111111111111111',
      email: 'user1@test.com',
      emailVerified: true,
      fullName: 'Test User 1',
      accountStatus: 'active',
      kycStatus: 'approved',
      kycTier: 'tier1',
      balanceUsdc: 1000,
      roles: {
        create: { role: 'user' },
      },
      wallets: {
        create: {
          walletAddress: '0x1111111111111111111111111111111111111111',
          walletType: 'embedded',
          chain: 'base',
          network: 'testnet',
          isPrimary: true,
          balanceUsdc: 1000,
        },
      },
    },
  });

  const testUser2 = await prisma.user.upsert({
    where: { email: 'user2@test.com' },
    update: {},
    create: {
      web3authId: 'test-user-2',
      walletAddress: '0x2222222222222222222222222222222222222222',
      email: 'user2@test.com',
      emailVerified: true,
      fullName: 'Test User 2',
      accountStatus: 'active',
      kycStatus: 'approved',
      kycTier: 'tier2',
      balanceUsdc: 5000,
      roles: {
        create: { role: 'user' },
      },
      wallets: {
        create: {
          walletAddress: '0x2222222222222222222222222222222222222222',
          walletType: 'embedded',
          chain: 'base',
          network: 'testnet',
          isPrimary: true,
          balanceUsdc: 5000,
        },
      },
    },
  });

  logger.info(`Test users created: ${testUser1.id}, ${testUser2.id}`);

  // Create system settings
  const settings = [
    {
      settingKey: 'maintenance_mode',
      settingValue: { enabled: false },
      settingType: 'boolean',
      description: 'Enable/disable maintenance mode',
    },
    {
      settingKey: 'transaction_fee_percent',
      settingValue: { value: 0.5 },
      settingType: 'number',
      description: 'Transaction fee percentage',
    },
    {
      settingKey: 'withdrawal_fee_percent',
      settingValue: { value: 1.0 },
      settingType: 'number',
      description: 'Withdrawal fee percentage',
    },
    {
      settingKey: 'kyc_auto_approve_tier0',
      settingValue: { enabled: true },
      settingType: 'boolean',
      description: 'Auto-approve tier 0 KYC',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: {},
      create: setting,
    });
  }

  logger.info('System settings created');

  // Create support ticket categories
  logger.info('Database seed completed successfully!');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
