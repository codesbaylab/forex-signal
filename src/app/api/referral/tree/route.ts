import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const referrals = await prisma.profile.findMany({
      where: { referredById: user.id },
      select: { id: true, name: true, email: true, username: true, avatarUrl: true, createdAt: true },
    })

    return NextResponse.json({ success: true, data: referrals })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
