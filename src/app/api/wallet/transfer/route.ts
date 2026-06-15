import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { TransferSchema } from '@/lib/validations/wallet'
import { debitWallet, creditWallet } from '@/lib/wallet/transactions'
import { Currency, TransactionType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const parsed = TransferSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { toUsernameOrEmail, currency, amount, note } = parsed.data

    const recipient = await prisma.profile.findFirst({
      where: {
        OR: [
          { username: toUsernameOrEmail },
          { email: toUsernameOrEmail },
        ],
      },
    })

    if (!recipient) return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 })
    if (recipient.id === user.id) return NextResponse.json({ success: false, error: 'Cannot transfer to yourself' }, { status: 400 })
    if (recipient.isBanned) return NextResponse.json({ success: false, error: 'Recipient account is unavailable' }, { status: 400 })

    const reference = `transfer_${Date.now()}`

    await Promise.all([
      debitWallet({
        userId: user.id,
        currency: currency as Currency,
        amount,
        type: TransactionType.TRANSFER_OUT,
        reference,
        note: note ?? `Transfer to ${recipient.name}`,
      }),
    ])

    await creditWallet({
      userId: recipient.id,
      currency: currency as Currency,
      amount,
      type: TransactionType.TRANSFER_IN,
      reference,
      note: note ?? `Transfer from ${user.id}`,
    })

    return NextResponse.json({ success: true, data: { transferred: amount, currency, to: recipient.email } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transfer failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
