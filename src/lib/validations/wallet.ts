import { z } from 'zod'

const CurrencyEnum = z.enum(['USDT_TRC20', 'BTC', 'BNB_BEP20'])

export const DepositSchema = z.object({
  currency: CurrencyEnum,
  amount: z.number().positive('Amount must be positive'),
})

export const WithdrawSchema = z.object({
  currency: CurrencyEnum,
  amount: z.number().positive('Amount must be positive'),
  toAddress: z.string().min(10, 'Invalid wallet address'),
})

export const TransferSchema = z.object({
  toUsernameOrEmail: z.string().min(1, 'Recipient is required'),
  currency: CurrencyEnum,
  amount: z.number().positive('Amount must be positive'),
  note: z.string().max(200).optional(),
})

export type DepositInput = z.infer<typeof DepositSchema>
export type WithdrawInput = z.infer<typeof WithdrawSchema>
export type TransferInput = z.infer<typeof TransferSchema>
