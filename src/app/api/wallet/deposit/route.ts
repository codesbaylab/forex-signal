import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createPayment } from '@/lib/nowpayments/client'
import { DepositSchema } from '@/lib/validations/wallet'
import { Currency } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = DepositSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { currency, amount } = parsed.data

    const wallet = await prisma.wallet.findUnique({ where: { userId_currency: { userId: user.id, currency: currency as Currency } } })
    if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })

    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured. Please contact support.' }, { status: 503 })
    }

    const orderId = `dep_${user.id.slice(0, 8)}_${Date.now()}`
    const ipnCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`

    const payment = await createPayment({
      priceAmount: amount,
      priceCurrency: 'usd',
      payCurrency: currency,
      orderId,
      orderDescription: `Deposit ${amount} USD as ${currency}`,
      ipnCallbackUrl,
    })

    await prisma.deposit.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        currency: currency as Currency,
        amount: amount as unknown as number,
        payAmount: payment.pay_amount as unknown as number,
        payAddress: payment.pay_address,
        nowpaymentsPaymentId: String(payment.payment_id),
        nowpaymentsOrderId: orderId,
        status: 'WAITING',
      },
    })

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
