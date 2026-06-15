import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ManualWalletSchema } from '@/lib/validations/admin'
import { creditWallet, debitWallet } from '@/lib/wallet/transactions'
import { Currency, TransactionType } from '@prisma/client'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = ManualWalletSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { currency, amount, type, note } = parsed.data

    const fn = type === 'MANUAL_CREDIT' ? creditWallet : debitWallet
    const result = await fn({
      userId: id,
      currency: currency as Currency,
      amount,
      type: type as TransactionType,
      note,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
