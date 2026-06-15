import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { WithdrawSchema } from '@/lib/validations/wallet'
import { lockForWithdrawal } from '@/lib/wallet/transactions'
import { Currency } from '@prisma/client'
import Decimal from 'decimal.js'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = WithdrawSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { currency, amount, toAddress } = parsed.data
    const amountDecimal = new Decimal(amount)

    const wallet = await prisma.wallet.findUnique({ where: { userId_currency: { userId: user.id, currency: currency as Currency } } })
    if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })

    // Lock funds
    await lockForWithdrawal(user.id, currency as Currency, amountDecimal)

    // Create withdrawal record
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        currency: currency as Currency,
        amount: amount as unknown as number,
        toAddress,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ success: true, data: withdrawal }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Withdrawal failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
