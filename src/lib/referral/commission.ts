import { prisma } from '@/lib/prisma'
import { CommissionStatus, CommissionType, TransactionType } from '@prisma/client'
import Decimal from 'decimal.js'
import { creditWallet } from '@/lib/wallet/transactions'

export async function distributeCommissions(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, plan: true },
  })

  if (!subscription) throw new Error('Subscription not found')

  const levels = await prisma.referralConfig.findMany({
    where: { isActive: true },
    orderBy: { level: 'asc' },
  })

  if (levels.length === 0) return

  let currentUserId: string | null = subscription.userId
  const subscriptionAmount = new Decimal(subscription.paidAmount.toString())

  for (const levelConfig of levels) {
    const profile: { referredById: string | null } | null = await prisma.profile.findUnique({
      where: { id: currentUserId! },
      select: { referredById: true },
    })

    if (!profile?.referredById) break

    const upline: { id: string; isBanned: boolean; trialEndsAt: Date | null } | null = await prisma.profile.findUnique({
      where: { id: profile.referredById },
      select: { id: true, isBanned: true, trialEndsAt: true },
    })

    if (!upline || upline.isBanned) {
      currentUserId = profile.referredById
      continue
    }

    const now = new Date()
    const uplineActiveSub = await prisma.subscription.count({
      where: { userId: upline.id, status: 'ACTIVE' },
    })
    const uplineIsPaid = uplineActiveSub > 0
    const uplineTrialEndsAt = upline.trialEndsAt ? new Date(upline.trialEndsAt) : null
    const uplineInTrial = uplineTrialEndsAt !== null && uplineTrialEndsAt > now

    // Skip uplines with no access at all (expired trial, not paid, not in trial)
    if (!uplineIsPaid && !uplineInTrial && uplineTrialEndsAt !== null) {
      currentUserId = upline.id
      continue
    }

    let commissionAmount: Decimal
    if (levelConfig.commissionType === CommissionType.PERCENTAGE) {
      commissionAmount = subscriptionAmount.mul(new Decimal(levelConfig.commissionValue.toString())).div(100)
    } else {
      commissionAmount = new Decimal(levelConfig.commissionValue.toString())
    }

    if (uplineIsPaid) {
      // Paid upline — credit immediately
      const { transaction } = await creditWallet({
        userId: upline.id,
        currency: subscription.paidCurrency,
        amount: commissionAmount,
        type: TransactionType.COMMISSION,
        reference: subscriptionId,
        note: `Level ${levelConfig.level} commission from subscription`,
        metadata: { subscriptionId, level: levelConfig.level, sourceUserId: subscription.userId },
      })

      await prisma.commission.create({
        data: {
          recipientUserId: upline.id,
          sourceUserId: subscription.userId,
          subscriptionId,
          level: levelConfig.level,
          commissionType: levelConfig.commissionType,
          commissionValue: levelConfig.commissionValue,
          amount: commissionAmount.toFixed(8) as unknown as number,
          currency: subscription.paidCurrency,
          status: CommissionStatus.PAID,
          transactionId: transaction.id,
        },
      })
    } else {
      // Trial upline — hold as PENDING, expires 7 days after their trial ends
      const graceEnd = uplineTrialEndsAt
        ? new Date(uplineTrialEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null

      await prisma.commission.create({
        data: {
          recipientUserId: upline.id,
          sourceUserId: subscription.userId,
          subscriptionId,
          level: levelConfig.level,
          commissionType: levelConfig.commissionType,
          commissionValue: levelConfig.commissionValue,
          amount: commissionAmount.toFixed(8) as unknown as number,
          currency: subscription.paidCurrency,
          status: CommissionStatus.PENDING,
          expiresAt: graceEnd,
        },
      })
    }

    currentUserId = upline.id
  }
}

export async function releasePendingCommissions(userId: string): Promise<void> {
  const now = new Date()

  const pending = await prisma.commission.findMany({
    where: { recipientUserId: userId, status: CommissionStatus.PENDING },
    include: { subscription: true },
  })

  for (const commission of pending) {
    if (commission.expiresAt && commission.expiresAt < now) {
      // Grace period passed — expire it
      await prisma.commission.update({
        where: { id: commission.id },
        data: { status: CommissionStatus.FAILED },
      })
      continue
    }

    // Credit to wallet
    const { transaction } = await creditWallet({
      userId,
      currency: commission.currency,
      amount: commission.amount,
      type: TransactionType.COMMISSION,
      reference: commission.subscriptionId,
      note: `Level ${commission.level} commission (released on upgrade)`,
      metadata: { subscriptionId: commission.subscriptionId, level: commission.level, sourceUserId: commission.sourceUserId },
    })

    await prisma.commission.update({
      where: { id: commission.id },
      data: { status: CommissionStatus.PAID, transactionId: transaction.id },
    })
  }
}
