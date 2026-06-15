import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyNowPaymentsSignature } from '@/lib/nowpayments/webhook'
import { creditWallet } from '@/lib/wallet/transactions'
import { Currency, TransactionType } from '@prisma/client'
import type { NowPaymentsIPN } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-nowpayments-sig') ?? ''

    if (!verifyNowPaymentsSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }

    const payload: NowPaymentsIPN = JSON.parse(rawBody)
    const { payment_id, payment_status, order_id, actually_paid, pay_currency } = payload

    // Find the deposit record
    const deposit = await prisma.deposit.findFirst({
      where: { nowpaymentsOrderId: order_id },
    })

    if (!deposit) {
      return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 })
    }

    // Idempotent: if already finished, skip
    if (deposit.status === 'FINISHED') {
      return NextResponse.json({ success: true, data: { already_processed: true } })
    }

    const statusMap: Record<string, 'WAITING' | 'CONFIRMING' | 'CONFIRMED' | 'SENDING' | 'PARTIALLY_PAID' | 'FINISHED' | 'FAILED' | 'REFUNDED' | 'EXPIRED'> = {
      waiting: 'WAITING',
      confirming: 'CONFIRMING',
      confirmed: 'CONFIRMED',
      sending: 'SENDING',
      partially_paid: 'PARTIALLY_PAID',
      finished: 'FINISHED',
      failed: 'FAILED',
      refunded: 'REFUNDED',
      expired: 'EXPIRED',
    }

    const newStatus = statusMap[payment_status] ?? 'WAITING'

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: newStatus,
        txHash: payload.purchase_id ?? null,
        actuallyPaid: actually_paid ? (actually_paid as unknown as number) : null,
      },
    })

    if (payment_status === 'finished' && actually_paid > 0) {
      // Credit user wallet
      await creditWallet({
        userId: deposit.userId,
        currency: deposit.currency as Currency,
        amount: actually_paid,
        type: TransactionType.DEPOSIT,
        reference: order_id,
        note: `Deposit via NowPayments (${pay_currency})`,
        metadata: { paymentId: payment_id, orderId: order_id },
      })

      // Send notification
      await prisma.notification.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          title: 'Deposit Confirmed',
          body: `Your deposit of ${actually_paid} ${pay_currency} has been confirmed and credited to your wallet.`,
        },
      })
    }

    return NextResponse.json({ success: true, data: { status: newStatus } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error'
    console.error('NowPayments webhook error:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
