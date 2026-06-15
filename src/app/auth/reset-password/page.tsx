'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { ResetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  })

  async function onSubmit(data: ResetPasswordInput) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: data.password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-700 text-white font-bold text-xl mb-4">F</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Set new password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" className="mt-1" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" className="mt-1" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
