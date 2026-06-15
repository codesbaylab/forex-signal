import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { debitWallet } from '@/lib/wallet/transactions'
import { distributeCommissions } from '@/lib/referral/commission'
import { Currency, TransactionType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { planId, currency } = await request.json()

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) return NextResponse.json({ success: false, error: 'Plan not found or inactive' }, { status: 404 })

    const paidCurrency = (currency ?? plan.currency) as Currency
    const paidAmount = Number(plan.price)

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    })

    // Debit wallet (only if price > 0)
    if (paidAmount > 0) {
      await debitWallet({
        userId: user.id,
        currency: paidCurrency,
        amount: paidAmount,
        type: TransactionType.SUBSCRIPTION_PAYMENT,
        note: `Subscription to ${plan.name}`,
      })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        status: 'ACTIVE',
        startedAt: now,
        expiresAt,
        paidAmount: paidAmount as unknown as number,
        paidCurrency,
      },
    })

    // Distribute commissions async (don't block response)
    if (paidAmount > 0) {
      distributeCommissions(subscription.id).catch(console.error)
    }

    return NextResponse.json({ success: true, data: subscription }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
