'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  name: string | null
  email: string
}

export default function ProfileForm({ name, email }: Props) {
  const [nameVal, setNameVal] = useState(name ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" value={nameVal} onChange={(e) => setNameVal(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} disabled className="mt-1 bg-gray-50 text-gray-500" />
        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-600 text-xs">Profile updated!</p>}
      <Button onClick={save} disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
        {loading ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  )
}
