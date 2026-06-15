'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TransferSchema, type TransferInput } from '@/lib/validations/wallet'

export default function TransferPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [formData, setFormData] = useState<TransferInput | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransferInput>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { currency: 'USDT_TRC20' },
  })

  const selectedCurrency = watch('currency')

  function onSubmit(data: TransferInput) {
    setFormData(data)
    setConfirm(true)
  }

  async function confirmTransfer() {
    if (!formData) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transfer failed')
      setConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Transfer Complete" subtitle="" />
        <div className="bg-white rounded-2xl border border-gray-100 p-7 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 mb-2">Transfer Successful</h2>
          <p className="text-sm text-gray-500 mb-6">Funds have been transferred successfully.</p>
          <Button onClick={() => { setSuccess(false); setConfirm(false); setFormData(null); }} variant="outline">New Transfer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Transfer" subtitle="Send funds to another user" />

      {confirm && formData ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <h2 className="font-bold text-gray-900 mb-4">Confirm Transfer</h2>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4 border border-red-100">{error}</div>}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm"><span className="text-gray-500">To</span><span className="font-medium text-gray-900">{formData.toUsernameOrEmail}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-medium text-gray-900">{formData.amount} {formData.currency}</span></div>
            {formData.note && <div className="flex justify-between text-sm"><span className="text-gray-500">Note</span><span className="font-medium text-gray-900">{formData.note}</span></div>}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setConfirm(false)} variant="outline" className="flex-1">Back</Button>
            <Button onClick={confirmTransfer} disabled={loading} className="flex-1 bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Sending…' : 'Confirm Transfer'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="toUsernameOrEmail">Recipient (username or email)</Label>
              <Input id="toUsernameOrEmail" className="mt-1" {...register('toUsernameOrEmail')} placeholder="username or email@example.com" />
              {errors.toUsernameOrEmail && <p className="text-red-500 text-xs mt-1">{errors.toUsernameOrEmail.message}</p>}
            </div>
            <div>
              <Label>Currency</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'USDT_TRC20', label: 'USDT TRC20' },
                  { value: 'BTC', label: 'Bitcoin' },
                  { value: 'BNB_BEP20', label: 'BNB BEP20' },
                ].map((opt) => (
                  <label key={opt.value} className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${selectedCurrency === opt.value ? 'border-brand-700 bg-brand-50' : 'border-gray-100 hover:border-gray-300'}`}>
                    <input type="radio" value={opt.value} {...register('currency')} className="sr-only" />
                    <span className="text-xs font-medium text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.00000001" className="mt-1" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" className="mt-1" {...register('note')} placeholder="What's this for?" />
            </div>
            <Button type="submit" className="w-full bg-brand-700 hover:bg-brand-800 text-white">Review Transfer</Button>
          </form>
        </div>
      )}
    </div>
  )
}
