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

export async function getMultipleQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const { data } = await axios.get(`${BASE_URL}/quote`, {
    params: { symbol: symbols.join(','), apikey: getApiKey() },
  })
  return data
}

export const SUPPORTED_PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP',
  'XAU/USD', 'XAG/USD',
]
