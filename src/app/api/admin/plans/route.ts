import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CreatePlanSchema } from '@/lib/validations/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = CreatePlanSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { features, signalAccess, ...rest } = parsed.data
    const plan = await prisma.plan.create({
      data: {
        ...rest,
        features: features as unknown as import('@prisma/client').Prisma.InputJsonValue,
        signalAccess: signalAccess as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, data: plan }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
