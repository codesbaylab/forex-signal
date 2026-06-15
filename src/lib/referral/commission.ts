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

    const uplineUser: { id: string; isBanned: boolean } | null = await prisma.profile.findUnique({
      where: { id: profile.referredById },
      select: { id: true, isBanned: true },
    })

    if (!uplineUser || uplineUser.isBanned) {
      currentUserId = profile.referredById
      continue
    }

    // Calculate commission amount
    let commissionAmount: Decimal
    if (levelConfig.commissionType === CommissionType.PERCENTAGE) {
      commissionAmount = subscriptionAmount.mul(new Decimal(levelConfig.commissionValue.toString())).div(100)
    } else {
      commissionAmount = new Decimal(levelConfig.commissionValue.toString())
    }

    // Credit wallet
    const { transaction } = await creditWallet({
      userId: uplineUser.id,
      currency: subscription.paidCurrency,
      amount: commissionAmount,
      type: TransactionType.COMMISSION,
      reference: subscriptionId,
      note: `Level ${levelConfig.level} commission from subscription`,
      metadata: { subscriptionId, level: levelConfig.level, sourceUserId: subscription.userId },
    })

    // Record commission
    await prisma.commission.create({
      data: {
        recipientUserId: uplineUser.id,
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

    currentUserId = uplineUser.id
  }
}
