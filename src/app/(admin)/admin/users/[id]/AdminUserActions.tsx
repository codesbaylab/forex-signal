'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function AdminUserActions({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleBan() {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBanned: !isBanned }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button onClick={toggleBan} disabled={loading} variant={isBanned ? 'outline' : 'destructive'} className="w-full text-sm">
      {loading ? 'Updating…' : isBanned ? 'Unban User' : 'Ban User'}
    </Button>
  )
}
