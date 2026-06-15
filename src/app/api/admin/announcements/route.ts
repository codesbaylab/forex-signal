import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CreateAnnouncementSchema } from '@/lib/validations/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || profile.role !== 'ADMIN') return null
  return { id: user.id }
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json({ success: true, data: announcements })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = CreateAnnouncementSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        isPublished: parsed.data.publishNow,
        publishedAt: parsed.data.publishNow ? new Date() : null,
        createdBy: admin.id,
      },
    })

    return NextResponse.json({ success: true, data: announcement }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
