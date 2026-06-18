import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchAllPrices } from '@/lib/forex/twelvedata'

function isMarketHours(): boolean {
  const now = new Date()
  const day = now.getUTCDay() // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false
  const hour = now.getUTCHours()
  return hour >= 7 && hour < 22 // covers Sydney, Tokyo, London, NY
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isMarketHours()) {
    return NextResponse.json({ success: true, skipped: true, reason: 'Market closed' })
  }

  try {
    const prices = await fetchAllPrices()
    const count = Object.keys(prices).length

    if (count === 0) {
      return NextResponse.json({ success: false, error: 'No prices returned from Twelve Data' }, { status: 502 })
    }

    await prisma.setting.upsert({
      where: { key: 'forex_prices' },
      update: { value: JSON.stringify(prices) },
      create: { key: 'forex_prices', value: JSON.stringify(prices) },
    })

    return NextResponse.json({ success: true, pairs: count, updatedAt: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
