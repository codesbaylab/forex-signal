import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SendNotificationSchema } from '@/lib/validations/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = SendNotificationSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 400 })

    const { userId, type, title, body: notifBody, actionUrl } = parsed.data

    if (userId) {
      // Send to specific user
      const notification = await prisma.notification.create({
        data: { userId, type, title, body: notifBody, actionUrl: actionUrl || null },
      })
      return NextResponse.json({ success: true, data: notification }, { status: 201 })
    } else {
      // Broadcast to all users
      const users = await prisma.profile.findMany({ select: { id: true } })
      await prisma.notification.createMany({
        data: users.map((u) => ({ userId: u.id, type, title, body: notifBody, actionUrl: actionUrl || null })),
      })
      return NextResponse.json({ success: true, data: { sent: users.length } }, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
