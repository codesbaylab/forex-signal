import { z } from 'zod'

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isBanned: z.boolean().optional(),
  bannedReason: z.string().max(500).optional(),
})

export const ManualWalletSchema = z.object({
  currency: z.enum(['USDT_TRC20']).default('USDT_TRC20'),
  amount: z.number().positive(),
  type: z.enum(['MANUAL_CREDIT', 'MANUAL_DEBIT']),
  note: z.string().min(1, 'Note is required for manual adjustments'),
})

export const UpdateWithdrawalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(500).optional(),
})

export const ReferralConfigSchema = z.object({
  levels: z.array(
    z.object({
      level: z.number().int().positive(),
      commissionType: z.enum(['PERCENTAGE', 'FIXED']),
      commissionValue: z.number().positive(),
      isActive: z.boolean(),
    })
  ),
})

export const CreatePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.enum(['USDT_TRC20']).default('USDT_TRC20'),
  durationDays: z.number().int().positive(),
  features: z.array(z.string()),
  signalAccess: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  publishNow: z.boolean().default(false),
})

export const SendNotificationSchema = z.object({
  userId: z.string().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  actionUrl: z.string().url().optional().or(z.literal('')),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type ManualWalletInput = z.infer<typeof ManualWalletSchema>
export type UpdateWithdrawalInput = z.infer<typeof UpdateWithdrawalSchema>
export type ReferralConfigInput = z.infer<typeof ReferralConfigSchema>
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>
export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>
export type SendNotificationInput = z.infer<typeof SendNotificationSchema>
