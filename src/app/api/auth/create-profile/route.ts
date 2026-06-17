import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { Currency } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { name, referralCode } = await request.json()

    // Check if profile already exists
    const existing = await prisma.profile.findUnique({ where: { id: user.id } })
    if (existing) return NextResponse.json({ success: true, data: existing })

    // Find referrer
    let referredById: string | undefined
    if (referralCode) {
      const referrer = await prisma.profile.findUnique({ where: { referralCode } })
      if (referrer) referredById = referrer.id
    }

    const newReferralCode = nanoid(8).toUpperCase()
    const username = user.email?.split('@')[0] ?? nanoid(6)

    const profile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email!,
        name: name ?? user.email?.split('@')[0] ?? 'User',
        username,
        referralCode: newReferralCode,
        referredById,
        wallets: {
          create: [{ currency: Currency.USDT_TRC20 }],
        },
      },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
