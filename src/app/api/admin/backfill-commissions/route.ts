import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { distributeCommissions } from '@/lib/referral/commission'

// POST /api/admin/backfill-commissions
// Re-runs distributeCommissions for all paid subscriptions that have no commission records
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const subscriptions = await prisma.subscription.findMany({
      where: {
        paidAmount: { gt: 0 },
        commissions: { none: {} },
      },
      select: { id: true },
    })

    let processed = 0
    const errors: string[] = []
    for (const sub of subscriptions) {
      try {
        await distributeCommissions(sub.id)
        processed++
      } catch (e) {
        errors.push(`${sub.id}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return NextResponse.json({ processed, skipped: errors.length, errors })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
