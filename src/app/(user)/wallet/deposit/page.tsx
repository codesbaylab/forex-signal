'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DepositSchema, type DepositInput } from '@/lib/validations/wallet'

type PaymentInfo = {
  pay_address: string
  pay_amount: number
  pay_currency: string
  payment_id: string
}

export default function DepositPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DepositInput>({
    resolver: zodResolver(DepositSchema),
    defaultValues: { currency: 'USDT_TRC20' },
  })

  const selectedCurrency = watch('currency')

  async function onSubmit(data: DepositInput) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setPaymentInfo(json.data)
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Deposit" subtitle="Add funds to your wallet" />

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Currency</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'USDT_TRC20', label: 'USDT TRC20', icon: '₮' },
                  { value: 'BTC', label: 'Bitcoin', icon: '₿' },
                  { value: 'BNB_BEP20', label: 'BNB BEP20', icon: 'B' },
                ].map((opt) => (
                  <label key={opt.value} className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedCurrency === opt.value ? 'border-brand-700 bg-brand-50' : 'border-gray-100 hover:border-gray-300'}`}>
                    <input type="radio" value={opt.value} {...register('currency')} className="sr-only" />
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
            </div>
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" type="number" step="0.01" min="1" className="mt-1" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Creating payment…' : 'Continue to Payment'}
            </Button>
          </form>
        </div>
      )}

      {step === 2 && paymentInfo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-900 text-lg">Send Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Send the exact amount to the address below</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Payment Address</p>
              <p className="font-mono text-sm text-gray-900 break-all">{paymentInfo.pay_address}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Amount to Send</p>
              <p className="font-bold text-gray-900 text-lg">{paymentInfo.pay_amount} {paymentInfo.pay_currency.toUpperCase()}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">⚠️ Important</p>
              <p className="text-xs text-yellow-600 mt-1">Send only the exact amount. Your wallet will be credited automatically after confirmation.</p>
            </div>
          </div>

          <Button onClick={() => setStep(1)} variant="outline" className="w-full mt-6">Make another deposit</Button>
        </div>
      )}
    </div>
  )
}
