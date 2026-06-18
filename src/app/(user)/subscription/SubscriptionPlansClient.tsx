'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Plan = {
  id: string
  name: string
  description: string | null
  price: number
  durationDays: number
  features: string[]
  currency: string
}

interface Props {
  plans: Plan[]
  currentPlanId?: string
  annualDiscountPct?: number
}

function annualMonthlyPrice(monthlyPrice: number, discountPct: number) {
  return Math.round(monthlyPrice * (1 - discountPct / 100))
}

function annualTotalPrice(monthlyPrice: number, discountPct: number) {
  return annualMonthlyPrice(monthlyPrice, discountPct) * 12
}

export default function SubscriptionPlansClient({ plans, currentPlanId, annualDiscountPct = 17 }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function subscribe(planId: string) {
    setLoading(planId)
    setError(null)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingPeriod: billing }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Subscription failed')
    } finally {
      setLoading(null)
    }
  }

  const paidPlans = plans.filter((p) => p.price > 0)
  const freePlans = plans.filter((p) => p.price === 0)

  return (
    <div>
      {/* Billing toggle */}
      {paidPlans.length > 0 && (
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annually
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Save {annualDiscountPct}%</span>
            </button>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-5 border border-red-100">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Free plans */}
        {freePlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col ${isCurrent ? 'border-brand-700 ring-1 ring-brand-700' : 'border-gray-100'}`}>
              {isCurrent && <span className="text-xs text-brand-700 font-semibold mb-3">Current Plan</span>}
              <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
              {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-extrabold text-gray-900">Free</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <Button onClick={() => subscribe(plan.id)} disabled={!!loading} variant="outline" className="w-full">
                  {loading === plan.id ? 'Processing…' : 'Get Free'}
                </Button>
              )}
            </div>
          )
        })}

        {/* Paid plans */}
        {paidPlans.map((plan) => {
          const isCurrent = currentPlanId === plan.id
          const monthlyPrice = plan.price
          const displayPrice = billing === 'annual' ? annualMonthlyPrice(monthlyPrice, annualDiscountPct) : monthlyPrice
          const totalCharge = billing === 'annual' ? annualTotalPrice(monthlyPrice, annualDiscountPct) : monthlyPrice

          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col relative ${isCurrent ? 'border-brand-700 ring-2 ring-brand-700' : 'border-gray-100'}`}>
              {isCurrent && <span className="text-xs text-brand-700 font-semibold mb-3">Current Plan</span>}
              {billing === 'annual' && (
                <div className="absolute -top-3 right-5 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}
              <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
              {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}

              <div className="mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">${displayPrice}</span>
                  <span className="text-sm text-gray-500">/ month</span>
                </div>
                {billing === 'annual' ? (
                  <p className="text-xs text-gray-400 mt-0.5">Billed as <span className="font-semibold text-gray-600">${totalCharge}/year</span></p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    or <span className="font-semibold text-green-600">${annualMonthlyPrice(monthlyPrice)}/mo</span> billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-2 flex-1 my-5">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>

              {!isCurrent && (
                <Button
                  onClick={() => subscribe(plan.id)}
                  disabled={!!loading}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white"
                >
                  {loading === plan.id
                    ? 'Processing…'
                    : `Subscribe — $${totalCharge} ${billing === 'annual' ? '/year' : '/month'}`}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
