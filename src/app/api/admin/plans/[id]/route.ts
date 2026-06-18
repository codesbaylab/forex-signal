import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CreatePlanSchema } from '@/lib/validations/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || profile.role !== 'ADMIN') return null
  return user
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = CreatePlanSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { features, signalAccess, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }
    if (features) updateData.features = features
    if (signalAccess) updateData.signalAccess = signalAccess

    const plan = await prisma.plan.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    // Block if any user currently has an active subscription on this plan
    const activeSubs = await prisma.subscription.count({ where: { planId: id, status: 'ACTIVE' } })
    if (activeSubs > 0) {
      return NextResponse.json({ success: false, error: `Cannot delete: ${activeSubs} user(s) have an active subscription on this plan.` }, { status: 409 })
    }

    // Clean up cancelled/expired subscriptions and their commissions
    const subs = await prisma.subscription.findMany({ where: { planId: id }, select: { id: true } })
    const subIds = subs.map((s) => s.id)
    if (subIds.length > 0) {
      await prisma.commission.deleteMany({ where: { subscriptionId: { in: subIds } } })
      await prisma.subscription.deleteMany({ where: { id: { in: subIds } } })
    }

    await prisma.plan.delete({ where: { id } })
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
