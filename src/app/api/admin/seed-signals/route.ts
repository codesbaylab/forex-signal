import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { SignalDirection, SignalTimeframe, SignalStatus, SignalResult } from '@prisma/client'

const SIGNALS = [
  { pair: 'EUR/USD', direction: SignalDirection.BUY, entryPrice: 1.08420, takeProfits: [1.08720, 1.09100], stopLoss: 1.08120, timeframe: SignalTimeframe.H1, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 30, analysis: 'Strong bullish momentum on H1 with RSI divergence and EMA 20/50 golden cross. Price bounced off key support at 1.0840.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-06-10T08:30:00Z'), closedAt: new Date('2025-06-10T14:15:00Z') },
  { pair: 'GBP/USD', direction: SignalDirection.SELL, entryPrice: 1.27350, takeProfits: [1.26950, 1.26500], stopLoss: 1.27750, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 40, analysis: 'Double top formation at 1.2740 resistance with bearish MACD crossover. RSI overbought on H4.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-06-09T10:00:00Z'), closedAt: new Date('2025-06-09T22:30:00Z') },
  { pair: 'XAU/USD', direction: SignalDirection.BUY, entryPrice: 2318.50, takeProfits: [2332.00, 2345.00], stopLoss: 2305.00, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 135, analysis: 'Gold holding above key support at 2315. Risk-off sentiment driving demand. EMA 200 acting as support on H4.', planAccess: ['pro'], publishedAt: new Date('2025-06-08T09:00:00Z'), closedAt: new Date('2025-06-09T08:00:00Z') },
  { pair: 'USD/JPY', direction: SignalDirection.SELL, entryPrice: 157.820, takeProfits: [157.320, 156.800], stopLoss: 158.320, timeframe: SignalTimeframe.H1, status: SignalStatus.SL_HIT, result: SignalResult.LOSS, pipsGained: -50, analysis: 'Bearish divergence on RSI with price at 158 resistance. However BOJ intervention risk limited downside.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-06-07T06:00:00Z'), closedAt: new Date('2025-06-07T11:45:00Z') },
  { pair: 'EUR/GBP', direction: SignalDirection.BUY, entryPrice: 0.84520, takeProfits: [0.84820, 0.85100], stopLoss: 0.84220, timeframe: SignalTimeframe.H1, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 30, analysis: 'Bullish flag breakout on H1. Strong support at 0.8450 with increasing buy volume and RSI recovery from 40.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-06-06T13:00:00Z'), closedAt: new Date('2025-06-06T18:30:00Z') },
  { pair: 'AUD/USD', direction: SignalDirection.SELL, entryPrice: 0.66180, takeProfits: [0.65880, 0.65500], stopLoss: 0.66480, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 30, analysis: 'AUD/USD rejected at 0.6620 resistance. Weak Chinese data weighing on commodity currencies. MACD histogram declining.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-06-05T07:00:00Z'), closedAt: new Date('2025-06-05T21:00:00Z') },
  { pair: 'USD/CAD', direction: SignalDirection.BUY, entryPrice: 1.36520, takeProfits: [1.36920, 1.37300], stopLoss: 1.36120, timeframe: SignalTimeframe.H1, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 40, analysis: 'Oil prices falling boosting USD/CAD. Bullish engulfing candle at 1.3650 support on H1. RSI crossover from oversold.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-06-04T14:00:00Z'), closedAt: new Date('2025-06-04T20:00:00Z') },
  { pair: 'NZD/USD', direction: SignalDirection.SELL, entryPrice: 0.61350, takeProfits: [0.61050, 0.60750], stopLoss: 0.61650, timeframe: SignalTimeframe.H1, status: SignalStatus.CLOSED, result: SignalResult.BREAKEVEN, pipsGained: 0, analysis: 'Bearish setup at 0.6135 resistance. Signal closed at entry due to RBNZ rate decision creating uncertainty.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-06-03T09:00:00Z'), closedAt: new Date('2025-06-03T14:00:00Z') },
  { pair: 'GBP/JPY', direction: SignalDirection.BUY, entryPrice: 200.450, takeProfits: [201.050, 201.800], stopLoss: 199.850, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 60, analysis: 'GBP/JPY breaking above 200.00 psychological level with strong momentum. UK PMI beat expectations. EMA trend bullish.', planAccess: ['pro'], publishedAt: new Date('2025-06-02T10:00:00Z'), closedAt: new Date('2025-06-03T06:00:00Z') },
  { pair: 'EUR/USD', direction: SignalDirection.SELL, entryPrice: 1.09250, takeProfits: [1.08850, 1.08400], stopLoss: 1.09650, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 40, analysis: 'EUR/USD topping at 1.0930 with bearish divergence. Strong USD NFP data expected. MACD bearish crossover on H4.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-05-30T08:00:00Z'), closedAt: new Date('2025-05-30T20:00:00Z') },
  { pair: 'XAU/USD', direction: SignalDirection.SELL, entryPrice: 2345.00, takeProfits: [2325.00, 2305.00], stopLoss: 2360.00, timeframe: SignalTimeframe.H4, status: SignalStatus.SL_HIT, result: SignalResult.LOSS, pipsGained: -150, analysis: 'Gold at key resistance. Risk-on mood reducing demand. However geopolitical tensions reversed the move.', planAccess: ['pro'], publishedAt: new Date('2025-05-28T09:00:00Z'), closedAt: new Date('2025-05-28T18:00:00Z') },
  { pair: 'USD/JPY', direction: SignalDirection.BUY, entryPrice: 155.200, takeProfits: [155.800, 156.500], stopLoss: 154.600, timeframe: SignalTimeframe.H1, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 60, analysis: 'USD strength on Fed hawkish comments. USD/JPY breakout above 155.00 psychological level with high volume.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-05-25T08:00:00Z'), closedAt: new Date('2025-05-26T10:00:00Z') },
  { pair: 'EUR/USD', direction: SignalDirection.BUY, entryPrice: 1.07850, takeProfits: [1.08250, 1.08600], stopLoss: 1.07500, timeframe: SignalTimeframe.D1, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 40, analysis: 'Daily chart showing strong bullish engulfing at 1.0780 key support. ECB rate decision positive for EUR. Multi-week setup.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-05-20T07:00:00Z'), closedAt: new Date('2025-05-22T15:00:00Z') },
  { pair: 'GBP/USD', direction: SignalDirection.BUY, entryPrice: 1.25400, takeProfits: [1.25900, 1.26400], stopLoss: 1.24900, timeframe: SignalTimeframe.H4, status: SignalStatus.TP_HIT, result: SignalResult.WIN, pipsGained: 50, analysis: 'GBP recovering on positive UK CPI data. H4 bullish flag breakout above 1.2540. RSI trending upward from 45.', planAccess: ['basic', 'pro'], publishedAt: new Date('2025-05-15T09:00:00Z'), closedAt: new Date('2025-05-16T14:00:00Z') },
  { pair: 'EUR/USD', direction: SignalDirection.BUY, entryPrice: 1.08950, takeProfits: [1.09350, 1.09800], stopLoss: 1.08550, timeframe: SignalTimeframe.H1, status: SignalStatus.ACTIVE, result: null, pipsGained: null, analysis: 'Fresh bullish setup as EUR/USD holds above 1.0890 support. RSI recovering from 38, MACD bullish crossover forming on H1. Watch for momentum continuation.', planAccess: ['free', 'basic', 'pro'], publishedAt: new Date('2025-06-15T06:00:00Z'), closedAt: null },
  { pair: 'GBP/JPY', direction: SignalDirection.SELL, entryPrice: 201.850, takeProfits: [201.250, 200.500], stopLoss: 202.450, timeframe: SignalTimeframe.H4, status: SignalStatus.ACTIVE, result: null, pipsGained: null, analysis: 'GBP/JPY showing bearish exhaustion at 201.80-202.00 resistance zone. RSI overbought at 72 on H4. Risk event: UK jobs data tomorrow.', planAccess: ['pro'], publishedAt: new Date('2025-06-15T07:30:00Z'), closedAt: null },
  { pair: 'XAU/USD', direction: SignalDirection.BUY, entryPrice: 2325.00, takeProfits: [2345.00, 2365.00], stopLoss: 2308.00, timeframe: SignalTimeframe.H4, status: SignalStatus.ACTIVE, result: null, pipsGained: null, analysis: 'Gold finding strong support at 2320-2325 zone. Geopolitical risk premium intact. H4 shows bullish pin bar. CPI data tomorrow could be catalyst.', planAccess: ['pro'], publishedAt: new Date('2025-06-15T05:00:00Z'), closedAt: null },
]

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await prisma.profile.findUnique({ where: { id: user.id } })
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const existing = await prisma.signal.count()
    if (existing > 0) return NextResponse.json({ message: `Skipped — ${existing} signals already exist` })

    await prisma.signal.createMany({
      data: SIGNALS.map((s) => ({
        pair: s.pair,
        direction: s.direction,
        entryPrice: s.entryPrice,
        takeProfits: s.takeProfits,
        stopLoss: s.stopLoss,
        timeframe: s.timeframe,
        status: s.status,
        result: s.result,
        pipsGained: s.pipsGained,
        analysis: s.analysis,
        planAccess: s.planAccess,
        publishedAt: s.publishedAt,
        closedAt: s.closedAt,
        createdBy: admin.id,
      })),
    })

    return NextResponse.json({ success: true, count: SIGNALS.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
