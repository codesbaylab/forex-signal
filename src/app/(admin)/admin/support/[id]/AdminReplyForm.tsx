'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function AdminReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    await fetch(`/api/admin/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    })
    setBody('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-sm font-semibold text-gray-900 mb-3">Admin Reply</p>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your reply…" rows={3} className="mb-3" />
      <Button type="submit" disabled={loading || !body.trim()} className="bg-brand-700 hover:bg-brand-800 text-white">
        {loading ? 'Sending…' : 'Send Reply'}
      </Button>
    </form>
  )
}
