'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function DeletePlanButton({ planId, planName }: { planId: string; planName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(`"${planName}" deleted`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete plan')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          className="flex-1 text-sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Deleting…' : 'Confirm Delete'}
        </Button>
        <Button
          variant="outline"
          className="text-sm px-3"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className="w-full text-sm text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
      Delete
    </Button>
  )
}
