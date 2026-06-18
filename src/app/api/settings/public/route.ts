import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'annual_discount_pct' } })
  return NextResponse.json({ annualDiscountPct: Number(setting?.value ?? 17) })
}
