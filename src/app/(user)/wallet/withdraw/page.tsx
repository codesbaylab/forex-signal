'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WithdrawSchema, type WithdrawInput } from '@/lib/validations/wallet'

export default function WithdrawPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<WithdrawInput>({
    resolver: zodResolver(WithdrawSchema),
    defaultValues: { currency: 'USDT_TRC20' },
  })

  async function onSubmit(data: WithdrawInput) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Withdrawal Submitted" subtitle="" />
        <div className="bg-white rounded-2xl border border-gray-100 p-7 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 mb-2">Withdrawal Pending</h2>
          <p className="text-sm text-gray-500 mb-6">Your withdrawal request has been submitted and is pending admin approval. Funds are locked until processed.</p>
          <Button onClick={() => setSuccess(false)} variant="outline">New Withdrawal</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Withdraw" subtitle="Withdraw funds from your wallet" />
      <div className="bg-white rounded-2xl border border-gray-100 p-7">
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <Label>Currency</Label>
            <div className="mt-2 flex items-center gap-3 bg-brand-50 border-2 border-brand-700 rounded-xl px-4 py-3">
              <span className="text-xl">₮</span>
              <span className="text-sm font-semibold text-brand-700">USDT (TRC20)</span>
            </div>
            <input type="hidden" value="USDT_TRC20" {...register('currency')} />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.00000001" min="0.00001" className="mt-1" {...register('amount', { valueAsNumber: true })} />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="toAddress">Destination Address</Label>
            <Input id="toAddress" className="mt-1 font-mono text-sm" {...register('toAddress')} placeholder="Your wallet address" />
            {errors.toAddress && <p className="text-red-500 text-xs mt-1">{errors.toAddress.message}</p>}
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-xs text-yellow-700">Withdrawals are reviewed by admin within 24 hours. Funds will be locked until processed.</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
            {loading ? 'Submitting…' : 'Submit Withdrawal'}
          </Button>
        </form>
      </div>
    </div>
  )
}
