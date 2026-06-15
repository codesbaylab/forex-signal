import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { message: msgText } = await request.json()
    if (!msgText) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })

    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })

    // Allow user to reply only if it's their ticket
    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    if (ticket.userId !== user.id && profile.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        message: msgText,
        isAdmin: profile.role === 'ADMIN',
      },
    })

    // Update ticket updatedAt
    await prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } })

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
