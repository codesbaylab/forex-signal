import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'forex_prices' } })
    const prices = setting?.value ? JSON.parse(setting.value) : {}
    return NextResponse.json({ success: true, data: prices })
  } catch {
    return NextResponse.json({ success: true, data: {} })
  }
}
