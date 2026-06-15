import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const me = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!me || me.role !== 'ADMIN') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { message: msgText } = await request.json()
    if (!msgText) return NextResponse.json({ success: false, error: 'Message required' }, { status: 400 })

    const message = await prisma.ticketMessage.create({
      data: { ticketId: id, senderId: user.id, message: msgText, isAdmin: true },
    })

    await prisma.supportTicket.update({ where: { id }, data: { status: 'IN_PROGRESS', updatedAt: new Date() } })

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
