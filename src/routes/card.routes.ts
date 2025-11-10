import { Router } from 'express';
import { authenticate, requireKyc } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireKyc); // Cards require KYC

// POST /api/v1/cards/request
router.post('/request', async (req, res: any) => {
  res.json({ success: true, message: 'Card endpoint implementation pending' });
});

// GET /api/v1/cards
router.get('/', async (req, res: any) => {
  res.json({ success: true, message: 'Card endpoint implementation pending' });
});

// GET /api/v1/cards/:id
router.get('/:id', async (req, res: any) => {
  res.json({ success: true, message: 'Card endpoint implementation pending' });
});

export default router;
