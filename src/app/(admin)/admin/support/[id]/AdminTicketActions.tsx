'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AdminTicketActions({ ticketId, status }: { ticketId: string; status: string; priority: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    await fetch(`/api/admin/support/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status !== 'RESOLVED' && (
        <Button onClick={() => updateStatus('RESOLVED')} disabled={loading} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 text-xs h-8">Resolve</Button>
      )}
      {status !== 'CLOSED' && (
        <Button onClick={() => updateStatus('CLOSED')} disabled={loading} variant="outline" className="text-gray-600 text-xs h-8">Close</Button>
      )}
      {status === 'CLOSED' && (
        <Button onClick={() => updateStatus('OPEN')} disabled={loading} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs h-8">Reopen</Button>
      )}
    </div>
  )
}
