'use client'
import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { RegisterSchema, type RegisterInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') ?? ''
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { referralCode: ref },
  })

  async function onSubmit(data: RegisterInput) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }
    // Create profile
    await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, referralCode: data.referralCode }),
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-700 text-white font-bold text-xl mb-4">S</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Start trading with SignalFX Pro</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" className="mt-1" {...register('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" className="mt-1" {...register('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" className="mt-1" {...register('password')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="referralCode">Referral code (optional)</Label>
              <Input id="referralCode" className="mt-1" {...register('referralCode')} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  )
}
