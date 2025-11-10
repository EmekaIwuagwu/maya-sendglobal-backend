# Maya Global Pay - Backend API

> Complete Web3 payment platform with embedded wallets, gasless USDC transactions, virtual/physical cards, escrow, KYC, and comprehensive admin tools.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-blueviolet)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Features

### Core Features
- ✅ **Web3Auth Integration** - Wallet-based authentication with social logins
- ✅ **Gasless Transactions** - USDC transfers with zero gas fees via Circle Paymaster
- ✅ **Base Network** - Built on Base (Ethereum L2) for fast, cheap transactions
- ✅ **Multi-tier KYC** - 4-tier KYC system with document verification
- ✅ **Virtual & Physical Cards** - Issue cards linked to USDC balance
- ✅ **Escrow System** - Secure fund holding with dispute resolution
- ✅ **Email Payments** - Send USDC to any email address
- ✅ **Money Requests** - Request payments with shareable links
- ✅ **Multi-currency Withdrawals** - Bank transfer, mobile money, crypto
- ✅ **Support Tickets** - Complete customer support system
- ✅ **Admin Dashboard** - Comprehensive admin panel with analytics
- ✅ **Fraud Detection** - Real-time transaction monitoring
- ✅ **Referral System** - User referral rewards program

### Technical Features
- 🔐 JWT-based authentication with refresh tokens
- 🛡️ Role-based access control (RBAC)
- 📊 PostgreSQL database with Prisma ORM
- ⚡ Redis caching and rate limiting
- 📧 Email notifications (SendGrid)
- 📱 SMS notifications (Twilio)
- ☁️ AWS S3 file storage for KYC documents
- 🔄 Background job processing with BullMQ
- 📝 Comprehensive API documentation (Swagger)
- 🐳 Docker containerization
- 🧪 Test coverage with Jest
- 📊 Winston logging + Sentry error tracking
- 🔒 Data encryption for sensitive information
- 🚦 Rate limiting on all endpoints

## ⚡ Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for local development)
- PostgreSQL 15+ (if not using Docker)
- Redis 7+ (if not using Docker)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/maya-sendglobal-backend.git
cd maya-sendglobal-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker Compose**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run prisma:migrate
```

6. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

API Documentation (Swagger): `http://localhost:3000/api-docs`

## 📚 API Documentation

### Main Endpoints

#### Authentication
- `POST /api/v1/auth/web3auth/login` - Login with Web3Auth
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

#### Transactions
- `POST /api/v1/transactions/send` - Send USDC
- `GET /api/v1/transactions/history` - Transaction history
- `GET /api/v1/transactions/:id` - Get transaction
- `POST /api/v1/transactions/estimate-fee` - Estimate fee

Visit `http://localhost:3000/api-docs` for complete API documentation.

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t maya-backend .

# Run container
docker run -p 3000:3000 --env-file .env maya-backend
```

## 📧 Support

For support, email support@mayaglobalpay.com or open an issue on GitHub.

---

Built with ❤️ by Maya Global Pay Team
