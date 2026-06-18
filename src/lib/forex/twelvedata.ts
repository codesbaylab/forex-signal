import axios from 'axios'

const BASE_URL = 'https://api.twelvedata.com'

function getApiKey() {
  return process.env.TWELVE_DATA_API_KEY!
}

export type Candle = {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}

export type Quote = {
  symbol: string
  name: string
  exchange: string
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
  previous_close: string
  change: string
  percent_change: string
}

export type PriceData = {
  price: string
  change: string
  pct: string
  dir: 'up' | 'down'
  updatedAt: number
}

export const SUPPORTED_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'XAU/USD', 'GBP/JPY',
]

export function formatPrice(pair: string, price: string | number): string {
  const p = parseFloat(String(price))
  if (pair.includes('JPY')) return p.toFixed(3)
  if (pair.startsWith('XAU')) return p.toFixed(2)
  return p.toFixed(5)
}

export async function getQuote(symbol: string): Promise<Quote> {
  const { data } = await axios.get(`${BASE_URL}/quote`, {
    params: { symbol, apikey: getApiKey() },
  })
  if (data.status === 'error') throw new Error(data.message)
  return data
}

export async function getCandles(
  symbol: string,
  interval: string = '1h',
  outputsize: number = 50
): Promise<Candle[]> {
  const { data } = await axios.get(`${BASE_URL}/time_series`, {
    params: { symbol, interval, outputsize, apikey: getApiKey() },
  })
  if (data.status === 'error') throw new Error(data.message)
  return data.values ?? []
}

export async function fetchAllPrices(): Promise<Record<string, PriceData>> {
  const { data } = await axios.get(`${BASE_URL}/quote`, {
    params: { symbol: SUPPORTED_PAIRS.join(','), apikey: getApiKey() },
    timeout: 15000,
  })

  const result: Record<string, PriceData> = {}
  const now = Date.now()

  for (const pair of SUPPORTED_PAIRS) {
    const q = data[pair]
    if (!q || q.status === 'error' || !q.close) continue
    const pct = parseFloat(q.percent_change ?? '0')
    result[pair] = {
      price: q.close,
      change: q.change ?? '0',
      pct: q.percent_change ?? '0',
      dir: pct >= 0 ? 'up' : 'down',
      updatedAt: now,
    }
  }

  return result
}
