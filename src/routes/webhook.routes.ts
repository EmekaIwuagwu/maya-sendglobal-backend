import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import CircleService from '../services/circle.service';

const router = Router();

// POST /api/v1/webhooks/circle/transaction
router.post(
  '/circle/transaction',
  asyncHandler(async (req, res: any) => {
    const signature = req.headers['x-circle-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    const isValid = CircleService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    // TODO: Process Circle webhook
    // Update transaction status based on webhook data

    res.json({ success: true });
  })
);

// POST /api/v1/webhooks/web3auth/user-update
router.post('/web3auth/user-update', async (req, res: any) => {
  // TODO: Process Web3Auth webhook
  res.json({ success: true });
});

export default router;
