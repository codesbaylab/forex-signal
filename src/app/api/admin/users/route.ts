import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || profile.role !== 'ADMIN') return null
  return user
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Number(searchParams.get('limit') ?? '20')
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}

    const [users, total] = await Promise.all([
      prisma.profile.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.profile.count({ where }),
    ])

    return NextResponse.json({ success: true, data: { items: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
