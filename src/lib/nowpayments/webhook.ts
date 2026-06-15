import crypto from 'crypto'

export function verifyNowPaymentsSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) return false

  const hmac = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex')

  return hmac === signature
}
