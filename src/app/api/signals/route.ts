import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CreateSignalSchema } from '@/lib/validations/signal'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Number(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where: { status: { in: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED'] } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.signal.count({ where: { status: { in: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED'] } } }),
    ])

    return NextResponse.json({ success: true, data: { items: signals, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile || profile.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = CreateSignalSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { publishNow, takeProfits, ...rest } = parsed.data

    const signal = await prisma.signal.create({
      data: {
        ...rest,
        takeProfits: takeProfits as unknown as import('@prisma/client').Prisma.InputJsonValue,
        status: publishNow ? 'ACTIVE' : 'DRAFT',
        createdBy: user.id,
        planAccess: rest.planAccess as unknown as import('@prisma/client').Prisma.InputJsonValue,
        publishedAt: publishNow ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, data: signal }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
