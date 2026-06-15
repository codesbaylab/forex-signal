'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function SendNotificationForm() {
  const [userId, setUserId] = useState('')
  const [type, setType] = useState('SYSTEM')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || undefined, type, title, body, actionUrl: actionUrl || undefined }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(userId ? 'Notification sent to user.' : `Broadcast sent to ${json.data?.sent ?? 'all'} users.`)
      setTitle('')
      setBody('')
      setActionUrl('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 max-w-lg">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-lg p-3 mb-5 border border-green-100">{success}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="userId">Target User ID (leave empty to broadcast)</Label>
          <Input id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1" placeholder="user-uuid or leave empty for all" />
        </div>
        <div>
          <Label htmlFor="type">Notification Type</Label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
            {['SYSTEM', 'SIGNAL', 'DEPOSIT', 'WITHDRAWAL', 'COMMISSION', 'SUBSCRIPTION', 'ANNOUNCEMENT'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="actionUrl">Action URL (optional)</Label>
          <Input id="actionUrl" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} className="mt-1" placeholder="https://…" />
        </div>
        <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
          {loading ? 'Sending…' : userId ? 'Send to User' : 'Broadcast to All'}
        </Button>
      </form>
    </div>
  )
}
