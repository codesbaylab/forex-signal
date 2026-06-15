import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? '30d'

    const daysMap: Record<string, number> = { '30d': 30, '90d': 90, '1y': 365 }
    const days = daysMap[period] ?? 30
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const subscriptions = await prisma.subscription.findMany({
      where: { startedAt: { gte: since } },
      select: { startedAt: true, paidAmount: true, paidCurrency: true },
      orderBy: { startedAt: 'asc' },
    })

    // Group by date
    const byDate: Record<string, number> = {}
    for (const sub of subscriptions) {
      if (!sub.startedAt) continue
      const date = sub.startedAt.toISOString().split('T')[0]!
      byDate[date] = (byDate[date] ?? 0) + Number(sub.paidAmount)
    }

    const data = Object.entries(byDate).map(([date, revenue]) => ({ date, revenue }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
