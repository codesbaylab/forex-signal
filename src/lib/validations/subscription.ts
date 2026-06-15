import { z } from 'zod'

export const SubscribeSchema = z.object({
  planId: z.string().cuid('Invalid plan'),
  currency: z.enum(['USDT_TRC20', 'BTC', 'BNB_BEP20']),
})

export type SubscribeInput = z.infer<typeof SubscribeSchema>
