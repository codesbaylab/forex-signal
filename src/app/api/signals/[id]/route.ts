import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { UpdateSignalSchema } from '@/lib/validations/signal'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const signal = await prisma.signal.findUnique({ where: { id } })
    if (!signal) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: signal })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key')
  const validKey = process.env.SIGNAL_PUBLISH_KEY
  if (validKey && apiKey === validKey) return true

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  return !!(profile && profile.role === 'ADMIN')
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!await isAuthorized(request)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = UpdateSignalSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { publishNow, takeProfits, planAccess, ...rest } = parsed.data

    const updateData: Record<string, unknown> = { ...rest }
    if (takeProfits) updateData.takeProfits = takeProfits
    if (planAccess) updateData.planAccess = planAccess
    if (publishNow !== undefined) {
      updateData.status = publishNow ? 'ACTIVE' : updateData.status ?? 'DRAFT'
      if (publishNow) updateData.publishedAt = new Date()
    }
    if (updateData.status && ['TP_HIT', 'SL_HIT', 'CLOSED'].includes(updateData.status as string)) {
      updateData.closedAt = new Date()
    }

    const signal = await prisma.signal.update({ where: { id }, data: updateData })
    return NextResponse.json({ success: true, data: signal })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!await isAuthorized(request)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const hard = searchParams.get('hard') === 'true'

    if (hard) {
      await prisma.signal.delete({ where: { id } })
    } else {
      await prisma.signal.update({ where: { id }, data: { status: 'CLOSED' } })
    }

    return NextResponse.json({ success: true, data: { deleted: true, hard } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
