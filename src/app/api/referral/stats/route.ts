import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const [referrals, commissions] = await Promise.all([
      prisma.profile.findMany({
        where: { referredById: user.id },
        include: { subscriptions: { where: { status: 'ACTIVE' }, take: 1 } },
      }),
      prisma.commission.findMany({
        where: { recipientUserId: user.id },
        select: { level: true, amount: true },
      }),
    ])

    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    const activeSubscribers = referrals.filter((r) => r.subscriptions.length > 0).length

    const byLevel: Record<number, { count: number; earned: number }> = {}
    for (const c of commissions) {
      if (!byLevel[c.level]) byLevel[c.level] = { count: 0, earned: 0 }
      byLevel[c.level]!.earned += Number(c.amount)
    }
    for (const _r of referrals) {
      if (!byLevel[1]) byLevel[1] = { count: 0, earned: 0 }
      byLevel[1]!.count++
    }

    const byLevelArray = Object.entries(byLevel).map(([level, data]) => ({
      level: Number(level),
      count: data.count,
      earned: data.earned.toFixed(8),
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalReferrals: referrals.length,
        activeSubscribers,
        totalEarned: totalEarned.toFixed(8),
        byLevel: byLevelArray,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
