'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  defaultValues?: { title: string; body: string; isPublished: boolean }
  announcementId?: string
}

export default function AnnouncementForm({ defaultValues, announcementId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [body, setBody] = useState(defaultValues?.body ?? '')
  const [publishNow, setPublishNow] = useState(defaultValues?.isPublished ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = announcementId ? `/api/admin/announcements/${announcementId}` : '/api/admin/announcements'
      const method = announcementId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, publishNow, isPublished: publishNow }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      router.push('/admin/announcements')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 max-w-lg">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="body">Content</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="mt-1" required placeholder="Write your announcement…" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="publishNow" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="w-4 h-4 accent-brand-700" />
          <Label htmlFor="publishNow">Publish immediately</Label>
        </div>
        <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
          {loading ? 'Saving…' : announcementId ? 'Update' : 'Create Announcement'}
        </Button>
      </form>
    </div>
  )
}
