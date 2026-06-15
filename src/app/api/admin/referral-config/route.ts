import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ReferralConfigSchema } from '@/lib/validations/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || profile.role !== 'ADMIN') return null
  return user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const levels = await prisma.referralConfig.findMany({ orderBy: { level: 'asc' } })
    return NextResponse.json({ success: true, data: levels })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = ReferralConfigSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    // Upsert all levels
    const results = await Promise.all(
      parsed.data.levels.map((level) =>
        prisma.referralConfig.upsert({
          where: { level: level.level },
          update: {
            commissionType: level.commissionType,
            commissionValue: level.commissionValue as unknown as number,
            isActive: level.isActive,
          },
          create: {
            level: level.level,
            commissionType: level.commissionType,
            commissionValue: level.commissionValue as unknown as number,
            isActive: level.isActive,
          },
        })
      )
    )

    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
