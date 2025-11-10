import { z } from 'zod';

export const sendTransactionSchema = z.object({
  recipientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
    .optional(),
  recipientEmail: z.string().email().optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  note: z.string().max(500).optional(),
}).refine((data) => data.recipientAddress || data.recipientEmail, {
  message: 'Either recipientAddress or recipientEmail must be provided',
});

export const requestMoneySchema = z.object({
  payerEmail: z.string().email().optional(),
  payerId: z.string().uuid().optional(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0'),
  description: z.string().min(1).max(500),
  expiresIn: z.number().int().positive().optional(),
});

export const estimateFeeSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format'),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  type: z.enum(['send', 'withdraw']),
});

export const transactionIdSchema = z.object({
  id: z.string().uuid('Invalid transaction ID'),
});

export const transactionFilterSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  type: z.enum(['send', 'receive', 'withdraw', 'deposit', 'escrow', 'request', 'card_payment', 'card_load', 'refund', 'fee']).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  startDate: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
});

export default {
  sendTransactionSchema,
  requestMoneySchema,
  estimateFeeSchema,
  transactionIdSchema,
  transactionFilterSchema,
};
