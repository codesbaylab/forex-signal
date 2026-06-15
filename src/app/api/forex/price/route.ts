import { NextRequest, NextResponse } from 'next/server'
import { getQuote } from '@/lib/forex/twelvedata'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    if (!symbol) return NextResponse.json({ success: false, error: 'symbol is required' }, { status: 400 })

    const quote = await getQuote(symbol)
    return NextResponse.json({ success: true, data: quote })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch price'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
