import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UpdateWithdrawalSchema } from '@/lib/validations/admin'
import { debitWallet, unlockWithdrawal } from '@/lib/wallet/transactions'
import { Currency, TransactionType } from '@prisma/client'
import Decimal from 'decimal.js'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = UpdateWithdrawalSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } })
    if (!withdrawal) return NextResponse.json({ success: false, error: 'Withdrawal not found' }, { status: 404 })
    if (withdrawal.status !== 'PENDING') return NextResponse.json({ success: false, error: 'Withdrawal is not pending' }, { status: 400 })

    const amount = new Decimal(withdrawal.amount.toString())

    if (parsed.data.action === 'APPROVE') {
      // Debit from balance (already locked) and unlock
      await unlockWithdrawal(withdrawal.userId, withdrawal.currency as Currency, amount)
      await debitWallet({
        userId: withdrawal.userId,
        currency: withdrawal.currency as Currency,
        amount,
        type: TransactionType.WITHDRAWAL,
        reference: id,
        note: 'Withdrawal approved by admin',
      })
      await prisma.withdrawal.update({ where: { id }, data: { status: 'APPROVED', adminNote: parsed.data.note } })
    } else {
      // Reject: unlock balance
      await unlockWithdrawal(withdrawal.userId, withdrawal.currency as Currency, amount)
      await prisma.withdrawal.update({ where: { id }, data: { status: 'REJECTED', adminNote: parsed.data.note } })
    }

    return NextResponse.json({ success: true, data: { processed: true } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
