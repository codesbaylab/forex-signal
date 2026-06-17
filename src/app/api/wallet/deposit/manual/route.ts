import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Currency } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { amount, txHash } = await request.json()
    if (!txHash?.trim()) return NextResponse.json({ success: false, error: 'Transaction hash is required' }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: Currency.USDT_TRC20 } },
    })
    if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })

    const existing = await prisma.deposit.findFirst({ where: { txHash: txHash.trim() } })
    if (existing) return NextResponse.json({ success: false, error: 'This transaction hash has already been submitted.' }, { status: 409 })

    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        currency: Currency.USDT_TRC20,
        amount: amount as unknown as number,
        txHash: txHash.trim(),
        status: 'WAITING',
      },
    })

    return NextResponse.json({ success: true, data: deposit }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit deposit'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
