import { z } from 'zod'

export const CreateSignalSchema = z.object({
  pair: z.string().min(3, 'Pair is required'),
  direction: z.enum(['BUY', 'SELL']),
  entryPrice: z.number().positive(),
  takeProfits: z
    .array(z.object({ level: z.number(), price: z.number().positive() }))
    .min(1, 'At least one take profit is required'),
  stopLoss: z.number().positive(),
  timeframe: z.enum(['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']),
  analysis: z.string().max(2000).optional(),
  chartUrl: z.string().url().optional().or(z.literal('')),
  planAccess: z.array(z.string()).default([]),
  publishNow: z.boolean().default(false),
})

export const UpdateSignalSchema = CreateSignalSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED']).optional(),
  result: z.enum(['WIN', 'LOSS', 'BREAKEVEN']).optional(),
  pipsGained: z.number().optional(),
})

export type CreateSignalInput = z.infer<typeof CreateSignalSchema>
export type UpdateSignalInput = z.infer<typeof UpdateSignalSchema>
