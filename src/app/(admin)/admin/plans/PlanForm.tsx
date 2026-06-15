'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PlanFormData {
  name: string
  description: string
  price: number
  currency: string
  durationDays: number
  features: string[]
  isActive: boolean
  sortOrder: number
}

interface Props {
  defaultValues?: Partial<PlanFormData>
  planId?: string
}

export default function PlanForm({ defaultValues, planId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featuresText, setFeaturesText] = useState((defaultValues?.features ?? []).join('\n'))
  const [form, setForm] = useState<PlanFormData>({
    name: defaultValues?.name ?? '',
    description: defaultValues?.description ?? '',
    price: defaultValues?.price ?? 0,
    currency: defaultValues?.currency ?? 'USDT_TRC20',
    durationDays: defaultValues?.durationDays ?? 30,
    features: defaultValues?.features ?? [],
    isActive: defaultValues?.isActive ?? true,
    sortOrder: defaultValues?.sortOrder ?? 0,
  })

  function set<K extends keyof PlanFormData>(k: K, v: PlanFormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const features = featuresText.split('\n').map((l) => l.trim()).filter(Boolean)
      const url = planId ? `/api/admin/plans/${planId}` : '/api/admin/plans'
      const method = planId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, features }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/admin/plans')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 max-w-lg">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1" required /></div>
        <div><Label htmlFor="description">Description</Label><Input id="description" value={form.description} onChange={(e) => set('description', e.target.value)} className="mt-1" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label htmlFor="price">Price</Label><Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', Number(e.target.value))} className="mt-1" /></div>
          <div><Label htmlFor="durationDays">Duration (days)</Label><Input id="durationDays" type="number" min="1" value={form.durationDays} onChange={(e) => set('durationDays', Number(e.target.value))} className="mt-1" /></div>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <select id="currency" value={form.currency} onChange={(e) => set('currency', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
            <option value="USDT_TRC20">USDT TRC20</option>
            <option value="BTC">Bitcoin</option>
            <option value="BNB_BEP20">BNB BEP20</option>
          </select>
        </div>
        <div>
          <Label htmlFor="features">Features (one per line)</Label>
          <textarea id="features" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none" placeholder="Unlimited signals&#10;All pairs&#10;Priority alerts" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          <Label htmlFor="isActive">Active (visible to users)</Label>
        </div>
        <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
          {loading ? 'Saving…' : planId ? 'Update Plan' : 'Create Plan'}
        </Button>
      </form>
    </div>
  )
}
