'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function DepositActions({ depositId, txHash }: { depositId: string; txHash: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [confirm, setConfirm] = useState(false)

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(json.message)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setLoading(null)
      setConfirm(false)
    }
  }

  if (!confirm) {
    return (
      <div className="flex gap-2">
        {txHash && (
          <a
            href={`https://tronscan.org/#/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Verify
          </a>
        )}
        <button onClick={() => setConfirm(true)} className="text-xs text-brand-700 hover:underline font-semibold">
          Review
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => act('approve')}
        disabled={!!loading}
        className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading === 'approve' ? '…' : 'Approve'}
      </button>
      <button
        onClick={() => act('reject')}
        disabled={!!loading}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
      >
        {loading === 'reject' ? '…' : 'Reject'}
      </button>
      <button onClick={() => setConfirm(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
    </div>
  )
}
