'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  planId: string
  planName: string
  price: number
  currency: string
  billingPeriod?: 'monthly' | 'annual'
}

export default function SubscribePlanButton({ planId, price, currency, billingPeriod = 'monthly' }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function subscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, currency, billingPeriod }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      window.location.href = '/dashboard'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Subscription failed')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      <Button onClick={subscribe} disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
        {loading ? 'Processing…' : `Subscribe — $${price}${billingPeriod === 'annual' ? '/year' : '/month'}`}
      </Button>
    </div>
  )
}
