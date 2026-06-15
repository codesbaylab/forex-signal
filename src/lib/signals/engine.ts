import {
  RSI,
  MACD,
  EMA,
  BollingerBands,
} from 'technicalindicators'

export type SignalAnalysis = {
  pair: string
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
  strength: number // 0-100
  rsi: number
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  bbPosition: 'ABOVE' | 'MIDDLE' | 'BELOW'
  summary: string
}

type IndicatorInput = {
  close: number[]
  high: number[]
  low: number[]
}

export function analyzeSignal(pair: string, data: IndicatorInput): SignalAnalysis {
  const { close } = data

  // RSI (14 period)
  const rsiValues = RSI.calculate({ values: close, period: 14 })
  const rsi = rsiValues[rsiValues.length - 1] ?? 50

  // MACD (12, 26, 9)
  const macdValues = MACD.calculate({
    values: close,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })
  const latestMacd = macdValues[macdValues.length - 1]
  const macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    !latestMacd ? 'NEUTRAL'
    : latestMacd.MACD! > latestMacd.signal! ? 'BULLISH'
    : latestMacd.MACD! < latestMacd.signal! ? 'BEARISH'
    : 'NEUTRAL'

  // EMA crossover (20 vs 50)
  const ema20 = EMA.calculate({ values: close, period: 20 })
  const ema50 = EMA.calculate({ values: close, period: 50 })
  const latestEma20 = ema20[ema20.length - 1]
  const latestEma50 = ema50[ema50.length - 1]
  const emaTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' =
    latestEma20 > latestEma50 ? 'BULLISH'
    : latestEma20 < latestEma50 ? 'BEARISH'
    : 'NEUTRAL'

  // Bollinger Bands (20, 2)
  const bbValues = BollingerBands.calculate({ values: close, period: 20, stdDev: 2 })
  const latestBB = bbValues[bbValues.length - 1]
  const latestClose = close[close.length - 1]
  const bbPosition: 'ABOVE' | 'MIDDLE' | 'BELOW' =
    !latestBB ? 'MIDDLE'
    : latestClose > latestBB.upper ? 'ABOVE'
    : latestClose < latestBB.lower ? 'BELOW'
    : 'MIDDLE'

  // Determine direction and strength
  let bullishScore = 0
  let bearishScore = 0

  if (rsi < 30) bullishScore += 30
  else if (rsi > 70) bearishScore += 30
  else if (rsi < 50) bullishScore += 10
  else bearishScore += 10

  if (macdSignal === 'BULLISH') bullishScore += 35
  else if (macdSignal === 'BEARISH') bearishScore += 35

  if (emaTrend === 'BULLISH') bullishScore += 25
  else if (emaTrend === 'BEARISH') bearishScore += 25

  if (bbPosition === 'BELOW') bullishScore += 10
  else if (bbPosition === 'ABOVE') bearishScore += 10

  const direction: 'BUY' | 'SELL' | 'NEUTRAL' =
    bullishScore > 60 ? 'BUY'
    : bearishScore > 60 ? 'SELL'
    : 'NEUTRAL'

  const strength = direction === 'BUY' ? bullishScore : direction === 'SELL' ? bearishScore : 50

  const summary = buildSummary({ direction, rsi, macdSignal, emaTrend, bbPosition, pair })

  return { pair, direction, strength, rsi, macdSignal, emaTrend, bbPosition, summary }
}

function buildSummary(params: Omit<SignalAnalysis, 'strength' | 'summary'>): string {
  const { pair, direction, rsi, macdSignal, emaTrend } = params
  return `${pair} showing ${direction === 'NEUTRAL' ? 'mixed' : direction === 'BUY' ? 'bullish' : 'bearish'} signals. RSI at ${rsi.toFixed(1)}, MACD ${macdSignal.toLowerCase()}, EMA trend ${emaTrend.toLowerCase()}.`
}
