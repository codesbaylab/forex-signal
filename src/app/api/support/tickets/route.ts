import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: tickets })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { subject, message } = await request.json()
    if (!subject || !message) return NextResponse.json({ success: false, error: 'Subject and message are required' }, { status: 400 })

    const profile = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!profile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        status: 'OPEN',
        priority: 'MEDIUM',
        messages: {
          create: {
            senderId: user.id,
            message: message,
            isAdmin: false,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: ticket }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
