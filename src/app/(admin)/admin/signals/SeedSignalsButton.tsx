'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'

export default function SeedSignalsButton({ hasExisting = false }: { hasExisting?: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSeed() {
    if (hasExisting && !confirm('This will delete all existing signals and replace them with real MT5 historical data. Continue?')) return
    setLoading(true)
    try {
      const url = hasExisting ? '/api/admin/seed-signals?force=true' : '/api/admin/seed-signals'
      const res = await fetch(url, { method: 'POST' })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      toast.success(`${json.count} real signals loaded from MT5 history`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSeed} disabled={loading} className="gap-2 text-sm">
      <Database className="w-4 h-4" />
      {loading ? 'Loading…' : hasExisting ? 'Reseed Real Data' : 'Seed History'}
    </Button>
  )
}
