'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSignalSchema, type CreateSignalInput } from '@/lib/validations/signal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_PAIRS } from '@/lib/forex/twelvedata'

interface Props {
  plans: { id: string; name: string }[]
  defaultValues?: Partial<CreateSignalInput>
  signalId?: string
}

export default function SignalForm({ plans, defaultValues, signalId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateSignalInput>({
    resolver: zodResolver(CreateSignalSchema),
    defaultValues: defaultValues ?? {
      pair: 'EUR/USD',
      direction: 'BUY',
      takeProfits: [{ level: 1, price: 0 }],
      timeframe: 'H1',
      planAccess: [],
      publishNow: false,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'takeProfits' })

  async function onSubmit(data: CreateSignalInput) {
    setLoading(true)
    setError(null)
    try {
      const url = signalId ? `/api/signals/${signalId}` : '/api/signals'
      const method = signalId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/admin/signals')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save signal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="pair">Pair</Label>
            <select id="pair" {...register('pair')} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
              {SUPPORTED_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label>Direction</Label>
            <div className="flex gap-3 mt-1">
              {(['BUY', 'SELL'] as const).map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={d} {...register('direction')} />
                  <span className={`text-sm font-semibold ${d === 'BUY' ? 'text-green-700' : 'text-red-600'}`}>{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="entryPrice">Entry Price</Label>
            <Input id="entryPrice" type="number" step="0.00001" className="mt-1" {...register('entryPrice', { valueAsNumber: true })} />
            {errors.entryPrice && <p className="text-red-500 text-xs mt-1">{errors.entryPrice.message}</p>}
          </div>
          <div>
            <Label htmlFor="stopLoss">Stop Loss</Label>
            <Input id="stopLoss" type="number" step="0.00001" className="mt-1" {...register('stopLoss', { valueAsNumber: true })} />
            {errors.stopLoss && <p className="text-red-500 text-xs mt-1">{errors.stopLoss.message}</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Take Profits</Label>
            <Button type="button" variant="outline" className="text-xs h-7 px-3" onClick={() => append({ level: fields.length + 1, price: 0 })}>Add TP</Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-3 items-center">
                <span className="text-xs text-gray-400 w-8">TP{i + 1}</span>
                <Input type="number" step="0.00001" {...register(`takeProfits.${i}.price`, { valueAsNumber: true })} className="flex-1" />
                <input type="hidden" {...register(`takeProfits.${i}.level`, { valueAsNumber: true })} value={i + 1} />
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" className="text-red-500 text-xs h-7 px-2" onClick={() => remove(i)}>Remove</Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label htmlFor="timeframe">Timeframe</Label>
            <select id="timeframe" {...register('timeframe')} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
              {['M1','M5','M15','M30','H1','H4','D1','W1'].map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>
          <div>
            <Label>Plan Access</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {plans.map((plan) => (
                <label key={plan.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="checkbox" value={plan.id} {...register('planAccess')} />
                  {plan.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="analysis">Analysis (optional)</Label>
          <Textarea id="analysis" rows={4} className="mt-1" {...register('analysis')} placeholder="Technical analysis notes…" />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="publishNow" {...register('publishNow')} />
          <Label htmlFor="publishNow">Publish immediately (set status to ACTIVE)</Label>
        </div>

        <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white px-8">
          {loading ? 'Saving…' : signalId ? 'Update Signal' : 'Create Signal'}
        </Button>
      </form>
    </div>
  )
}
