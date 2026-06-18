import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Currency, TransactionType } from '@prisma/client'
import { verifyUsdtDeposit } from '@/lib/tron/verify'
import { creditWallet } from '@/lib/wallet/transactions'

const MAX_TX_AGE_HOURS = 72

// Protected by CRON_SECRET header — set this in Vercel env vars
// cron-job.org calls this every 5 minutes with header: x-cron-secret: <your-secret>
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminAddress = await prisma.setting
    .findUnique({ where: { key: 'payment_manual_usdt_address' } })
    .then((s) => s?.value ?? '')

  if (!adminAddress) {
    return NextResponse.json({ error: 'Admin address not configured' }, { status: 503 })
  }

  // Find all WAITING manual deposits that have a TX hash
  const pending = await prisma.deposit.findMany({
    where: { status: 'WAITING', txHash: { not: null } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  const results = { approved: 0, expired: 0, stillPending: 0, errors: 0 }

  for (const deposit of pending) {
    try {
      // Auto-expire deposits older than 72 hours
      const ageHours = (Date.now() - deposit.createdAt.getTime()) / 3_600_000
      if (ageHours > MAX_TX_AGE_HOURS) {
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: { status: 'FAILED' },
        })
        results.expired++
        continue
      }

      const verification = await verifyUsdtDeposit(
        deposit.txHash!,
        adminAddress,
        Number(deposit.amount),
      )

      if (!verification.ok) {
        if (verification.retryable) {
          results.stillPending++
        } else {
          // Permanently invalid (wrong address, wrong token, etc.) — expire it
          await prisma.deposit.update({
            where: { id: deposit.id },
            data: { status: 'FAILED' },
          })
          results.expired++
        }
        continue
      }

      // Verified — credit wallet and mark finished
      await creditWallet({
        userId: deposit.userId,
        currency: deposit.currency as Currency,
        amount: verification.actualAmount,
        type: TransactionType.DEPOSIT,
        reference: deposit.id,
        note: `Deposit auto-verified — TX: ${deposit.txHash}`,
      })

      await prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: 'FINISHED',
          amount: verification.actualAmount as unknown as number,
        },
      })

      results.approved++
    } catch {
      results.errors++
    }
  }

  return NextResponse.json({ success: true, processed: pending.length, ...results })
}
