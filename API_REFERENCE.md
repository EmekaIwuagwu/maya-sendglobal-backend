# Maya Global Pay - API Reference

## Base URL
```
Development: http://localhost:3000/api/v1
Production: https://api.mayaglobalpay.com/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {  // Only for paginated endpoints
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}  // Optional
  }
}
```

## Endpoints

### Authentication

#### POST /auth/web3auth/login
Login with Web3Auth wallet.

**Request Body:**
```json
{
  "web3authToken": "string (required)",
  "walletAddress": "string (required)",
  "email": "string (optional)",
  "name": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "uuid",
      "walletAddress": "string",
      "email": "string",
      "fullName": "string",
      "kycStatus": "string",
      "kycTier": "string",
      "accountStatus": "string",
      "balanceUsdc": "string",
      "roles": ["user"]
    },
    "requiresKyc": true,
    "wallets": []
  }
}
```

#### POST /auth/refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string"
  }
}
```

#### GET /auth/me
Get current authenticated user.

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "walletAddress": "string",
    "email": "string",
    "fullName": "string",
    "kycStatus": "string",
    "kycTier": "string",
    "accountStatus": "string",
    "balanceUsdc": "string",
    "roles": ["user"],
    "emailVerified": true,
    "phoneVerified": false,
    "twoFactorEnabled": false,
    "createdAt": "datetime"
  }
}
```

---

### Transactions

#### POST /transactions/send
Send USDC transaction.

**Headers:** Authorization required

**Request Body:**
```json
{
  "recipientAddress": "string (optional)",
  "recipientEmail": "string (optional)",
  "amount": "string (required)",
  "note": "string (optional, max 500)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "transactionHash": "string",
    "paymasterTxHash": "string",
    "status": "processing",
    "amount": "100.000000",
    "fee": "0.500000",
    "referenceNumber": "TXN-ABC123"
  }
}
```

#### GET /transactions/history
Get transaction history.

**Headers:** Authorization required

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `type` (string, optional)
- `status` (string, optional)
- `startDate` (datetime, optional)
- `endDate` (datetime, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "send",
        "status": "completed",
        "amount": "100.000000",
        "fee": "0.500000",
        "transactionHash": "0x...",
        "referenceNumber": "TXN-ABC123",
        "sender": {},
        "recipient": {},
        "note": "string",
        "createdAt": "datetime",
        "completedAt": "datetime"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /transactions/:id
Get transaction by ID.

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "send",
    "status": "completed",
    "amount": "100.000000",
    "fee": "0.500000",
    "transactionHash": "0x...",
    "referenceNumber": "TXN-ABC123",
    "sender": {},
    "recipient": {},
    "note": "string",
    "createdAt": "datetime",
    "completedAt": "datetime"
  }
}
```

#### POST /transactions/estimate-fee
Estimate transaction fee.

**Headers:** Authorization required

**Request Body:**
```json
{
  "amount": "string (required)",
  "recipientAddress": "string (required)",
  "type": "send|withdraw (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimatedFee": "0.500000",
    "gasEstimate": "0",
    "totalAmount": "100.500000",
    "gasSponsored": true
  }
}
```

---

## Error Codes

### Authentication Errors (AUTH_XXX)
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Unauthorized access
- `AUTH_004`: Web3Auth validation failed
- `AUTH_008`: Invalid or missing token

### User Errors (USER_XXX)
- `USER_001`: User not found
- `USER_002`: Account suspended
- `USER_003`: Account frozen
- `USER_004`: KYC required
- `USER_006`: Email not verified

### Transaction Errors (TXN_XXX)
- `TXN_001`: Insufficient balance
- `TXN_002`: Transaction limit exceeded
- `TXN_003`: Daily limit exceeded
- `TXN_004`: Invalid recipient
- `TXN_005`: Transaction failed
- `TXN_008`: Minimum amount not met
- `TXN_009`: Maximum amount exceeded
- `TXN_010`: Transaction not found

### System Errors (SYS_XXX)
- `SYS_001`: Internal server error
- `SYS_002`: Service unavailable
- `SYS_003`: Rate limit exceeded
- `SYS_007`: Validation error

## Rate Limits

- **Authentication endpoints**: 5 requests per minute
- **Transaction endpoints**: 10 requests per minute
- **General API**: 100 requests per minute
- **Admin endpoints**: 200 requests per minute

## Pagination

Paginated endpoints support these query parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes pagination object:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks

### POST /webhooks/circle/transaction
Circle Paymaster webhook for transaction updates.

**Headers:**
- `x-circle-signature`: HMAC signature for verification

**Payload:**
```json
{
  "eventType": "transaction.completed",
  "transactionHash": "0x...",
  "paymasterTxHash": "0x...",
  "status": "completed",
  "gasUsed": "21000",
  "timestamp": "datetime"
}
```

## Best Practices

1. **Always check the `success` field** in responses
2. **Handle errors appropriately** using error codes
3. **Respect rate limits** to avoid 429 errors
4. **Use pagination** for large datasets
5. **Store tokens securely** (never in localStorage for web apps)
6. **Refresh tokens** before they expire
7. **Verify webhook signatures** for security
8. **Use idempotency keys** for critical operations

## Examples

### cURL Examples

**Login:**
```bash
curl -X POST https://api.mayaglobalpay.com/api/v1/auth/web3auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "web3authToken": "your-token",
    "walletAddress": "0x...",
    "email": "user@example.com"
  }'
```

**Send Transaction:**
```bash
curl -X POST https://api.mayaglobalpay.com/api/v1/transactions/send \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x...",
    "amount": "100.00",
    "note": "Payment for services"
  }'
```

### JavaScript/TypeScript Examples

**Using Axios:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.mayaglobalpay.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Login
const { data } = await api.post('/auth/web3auth/login', {
  web3authToken: token,
  walletAddress: address,
});

// Set token for future requests
api.defaults.headers.common['Authorization'] = `Bearer ${data.data.accessToken}`;

// Send transaction
const transaction = await api.post('/transactions/send', {
  recipientAddress: '0x...',
  amount: '100.00',
  note: 'Payment',
});
```

## Support

For API support:
- Email: api-support@mayaglobalpay.com
- Documentation: https://docs.mayaglobalpay.com
- Status Page: https://status.mayaglobalpay.com
