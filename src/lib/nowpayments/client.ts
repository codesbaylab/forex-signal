import axios from 'axios'
import type { NowPaymentsPayment } from '@/types'

const BASE_URL = process.env.NOWPAYMENTS_SANDBOX === 'true'
  ? 'https://api-sandbox.nowpayments.io/v1'
  : 'https://api.nowpayments.io/v1'

const CURRENCY_MAP: Record<string, string> = {
  USDT_TRC20: 'usdttrc20',
  BTC: 'btc',
  BNB_BEP20: 'bnbbsc',
}

function getClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: { 'x-api-key': process.env.NOWPAYMENTS_API_KEY! },
  })
}

export async function createPayment(params: {
  priceAmount: number
  priceCurrency: string
  payCurrency: string
  orderId: string
  orderDescription: string
  ipnCallbackUrl: string
}): Promise<NowPaymentsPayment> {
  const client = getClient()
  const { data } = await client.post('/payment', {
    price_amount: params.priceAmount,
    price_currency: params.priceCurrency,
    pay_currency: CURRENCY_MAP[params.payCurrency] ?? params.payCurrency,
    order_id: params.orderId,
    order_description: params.orderDescription,
    ipn_callback_url: params.ipnCallbackUrl,
  })
  return data
}

export async function getPaymentStatus(paymentId: string) {
  const client = getClient()
  const { data } = await client.get(`/payment/${paymentId}`)
  return data
}

export async function getMinimumPaymentAmount(currency: string): Promise<number> {
  const client = getClient()
  const mapped = CURRENCY_MAP[currency] ?? currency
  const { data } = await client.get(`/min-amount?currency_from=${mapped}&currency_to=${mapped}`)
  return data.min_amount
}
