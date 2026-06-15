'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function MarkAllReadButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markAll() {
    setLoading(true)
    await fetch('/api/notifications/read-all', { method: 'PUT' })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button onClick={markAll} disabled={loading} variant="outline" className="text-sm">
      {loading ? 'Marking…' : 'Mark all read'}
    </Button>
  )
}
