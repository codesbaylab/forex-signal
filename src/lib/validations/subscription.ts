import { z } from 'zod'

export const SubscribeSchema = z.object({
  planId: z.string().cuid('Invalid plan'),
  currency: z.enum(['USDT_TRC20']).default('USDT_TRC20'),
})

export type SubscribeInput = z.infer<typeof SubscribeSchema>
