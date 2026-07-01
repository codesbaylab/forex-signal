import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import { Currency } from '@prisma/client'

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwam.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'guerrillamail.net','guerrillamail.org','spam4.me','yopmail.com','yopmail.fr','cool.fr.nf',
  'jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf','trashmail.com','trashmail.me',
  'trashmail.at','discard.email','spamgourmet.com','mailnull.com','maildrop.cc',
  'getairmail.com','filzmail.com','dispostable.com','gufum.com','spamfree24.org',
  'trashmail.io','fakeinbox.com','tempinbox.com','spammotel.com','trashmail.net',
  'spambog.com','boun.cr','filzmail.de','sogetthis.com','spamspot.com',
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { name, referralCode } = await request.json()

    // Block disposable email domains
    const emailDomain = user.email?.split('@')[1]?.toLowerCase() ?? ''
    if (DISPOSABLE_DOMAINS.has(emailDomain)) {
      return NextResponse.json({ success: false, error: 'Disposable email addresses are not allowed. Please use a real email.' }, { status: 400 })
    }

    // Check if profile already exists
    const existing = await prisma.profile.findUnique({ where: { id: user.id } })
    if (existing) return NextResponse.json({ success: true, data: existing })

    // Find referrer
    let referredById: string | undefined
    if (referralCode) {
      const referrer = await prisma.profile.findUnique({ where: { referralCode } })
      if (referrer) referredById = referrer.id
    }

    // Get trial days from settings (default 7)
    const trialSetting = await prisma.setting.findUnique({ where: { key: 'trial_days' } })
    const trialDays = Math.max(1, parseInt(trialSetting?.value ?? '7', 10))
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)

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
        trialEndsAt,
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
