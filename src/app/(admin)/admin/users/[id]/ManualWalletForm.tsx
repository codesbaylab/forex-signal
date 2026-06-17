'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ManualWalletForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    type: 'MANUAL_CREDIT' as 'MANUAL_CREDIT' | 'MANUAL_DEBIT',
    currency: 'USDT_TRC20',
    amount: '',
    note: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.note) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/wallet`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(form.type === 'MANUAL_CREDIT' ? 'Balance credited successfully' : 'Balance debited successfully')
      setForm({ type: 'MANUAL_CREDIT', currency: 'USDT_TRC20', amount: '', note: '' })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust balance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Credit / Debit toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, type: 'MANUAL_CREDIT' }))}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.type === 'MANUAL_CREDIT' ? 'bg-green-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          + Credit
        </button>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, type: 'MANUAL_DEBIT' }))}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${form.type === 'MANUAL_DEBIT' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          − Debit
        </button>
      </div>

      <div>
        <Label className="text-xs text-gray-500">Currency</Label>
        <div className="mt-1 flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 px-3 py-2">
          <span className="text-base">₮</span>
          <span className="text-sm font-medium text-gray-700">USDT (TRC20)</span>
        </div>
      </div>

      <div>
        <Label className="text-xs text-gray-500">Amount</Label>
        <Input
          type="number"
          step="any"
          min="0"
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label className="text-xs text-gray-500">Note (reason)</Label>
        <Input
          type="text"
          placeholder="e.g. Bonus credit, refund correction"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          className="mt-1"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className={`w-full text-white font-semibold ${form.type === 'MANUAL_CREDIT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
      >
        {loading ? 'Processing…' : form.type === 'MANUAL_CREDIT' ? 'Credit Balance' : 'Debit Balance'}
      </Button>
    </form>
  )
}
