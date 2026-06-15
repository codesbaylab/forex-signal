import { NextRequest, NextResponse } from 'next/server'
import { getCandles } from '@/lib/forex/twelvedata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval') ?? '1h'
    const outputsize = Number(searchParams.get('outputsize') ?? '50')

    if (!symbol) return NextResponse.json({ success: false, error: 'symbol is required' }, { status: 400 })

    const candles = await getCandles(symbol, interval, outputsize)
    return NextResponse.json({ success: true, data: candles })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch candles'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
