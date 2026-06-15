'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function NewTicketButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setOpen(false)
      setSubject('')
      setMessage('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-brand-700 hover:bg-brand-800 text-white">New Ticket</Button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 text-lg mb-5">New Support Ticket</h2>
            {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="mt-1" required />
              </div>
              <div className="flex gap-3">
                <Button type="button" onClick={() => setOpen(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-brand-700 hover:bg-brand-800 text-white">
                  {loading ? 'Submitting…' : 'Submit Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
