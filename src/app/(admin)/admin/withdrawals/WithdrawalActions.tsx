'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function WithdrawalActions({ withdrawalId }: { withdrawalId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function act(action: 'APPROVE' | 'REJECT') {
    setLoading(true)
    await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => act('APPROVE')} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3">Approve</Button>
      <Button onClick={() => act('REJECT')} disabled={loading} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7 px-3">Reject</Button>
    </div>
  )
}
