'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'

export default function SeedSignalsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSeed() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/seed-signals', { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      if (json.message) {
        toast.info(json.message)
      } else {
        toast.success(`${json.count} signals seeded successfully`)
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSeed} disabled={loading} className="gap-2 text-sm">
      <Database className="w-4 h-4" />
      {loading ? 'Seeding…' : 'Seed History'}
    </Button>
  )
}
