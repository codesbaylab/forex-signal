import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { creditWallet } from '@/lib/wallet/transactions'
import { TransactionType } from '@prisma/client'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { action } = await request.json() // 'approve' | 'reject'

    const deposit = await prisma.deposit.findUnique({ where: { id } })
    if (!deposit) return NextResponse.json({ error: 'Deposit not found' }, { status: 404 })
    if (deposit.status !== 'WAITING') return NextResponse.json({ error: 'Deposit is not in WAITING status' }, { status: 400 })

    if (action === 'approve') {
      await creditWallet({
        userId: deposit.userId,
        currency: deposit.currency,
        amount: deposit.amount,
        type: TransactionType.DEPOSIT,
        reference: deposit.id,
        note: `Manual deposit approved${deposit.txHash ? ` — TX: ${deposit.txHash}` : ''}`,
      })
      await prisma.deposit.update({ where: { id }, data: { status: 'FINISHED' } })
      return NextResponse.json({ success: true, message: 'Deposit approved and wallet credited' })
    }

    if (action === 'reject') {
      await prisma.deposit.update({ where: { id }, data: { status: 'FAILED' } })
      return NextResponse.json({ success: true, message: 'Deposit rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
