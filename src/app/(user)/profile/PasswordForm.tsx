'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message) } else { setSuccess(true); setPassword(''); setConfirm('') }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="new-password">New Password</Label>
        <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" autoComplete="new-password" />
      </div>
      <div>
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" autoComplete="new-password" />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-600 text-xs">Password updated successfully!</p>}
      <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
        {loading ? 'Updating…' : 'Update Password'}
      </Button>
    </form>
  )
}
