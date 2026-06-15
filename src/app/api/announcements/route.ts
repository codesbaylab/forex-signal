import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ success: true, data: announcements })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
