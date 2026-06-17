import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { DepositSchema } from '@/lib/validations/wallet'
import { Currency } from '@prisma/client'
import axios from 'axios'

async function getSettings() {
  const rows = await prisma.setting.findMany()
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = DepositSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { currency, amount } = parsed.data
    const settings = await getSettings()

    const npEnabled = settings['payment_nowpayments_enabled'] === 'true'
    const manualEnabled = settings['payment_manual_enabled'] === 'true'

    if (!npEnabled && !manualEnabled) {
      return NextResponse.json({ success: false, error: 'Deposits are currently disabled. Please contact support.' }, { status: 503 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: currency as Currency } },
    })
    if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })

    // --- NowPayments ---
    if (npEnabled) {
      const apiKey = settings['payment_nowpayments_api_key'] || process.env.NOWPAYMENTS_API_KEY
      if (!apiKey) {
        return NextResponse.json({ success: false, error: 'Payment gateway not configured. Please contact support.' }, { status: 503 })
      }

      const sandbox = settings['payment_nowpayments_sandbox'] === 'true'
      const baseUrl = sandbox ? 'https://api-sandbox.nowpayments.io/v1' : 'https://api.nowpayments.io/v1'
      const appUrl = settings['next_public_app_url'] || process.env.NEXT_PUBLIC_APP_URL || ''
      const orderId = `dep_${user.id.slice(0, 8)}_${Date.now()}`

      const { data: payment } = await axios.post(
        `${baseUrl}/payment`,
        {
          price_amount: amount,
          price_currency: 'usd',
          pay_currency: 'usdttrc20',
          order_id: orderId,
          order_description: `Deposit ${amount} USD as USDT TRC20`,
          ipn_callback_url: `${appUrl}/api/webhooks/nowpayments`,
        },
        { headers: { 'x-api-key': apiKey } }
      )

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

      return NextResponse.json({ success: true, method: 'nowpayments', data: payment })
    }

    // --- Manual ---
    const address = settings['payment_manual_usdt_address']
    if (!address) {
      return NextResponse.json({ success: false, error: 'Deposit address not configured. Please contact support.' }, { status: 503 })
    }

    const note = settings['payment_manual_note'] ?? 'Send USDT (TRC20) to the address below and submit your transaction hash.'

    return NextResponse.json({
      success: true,
      method: 'manual',
      data: { address, amount, note },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deposit failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
