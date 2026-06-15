import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const ticket = await prisma.supportTicket.findUnique({
      where: { id, userId: user.id },
      include: {
        messages: {
          include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
