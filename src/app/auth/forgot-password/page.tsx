'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-700 text-white font-bold text-xl mb-4">F</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll send a reset link to your email</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 mb-6">We&apos;ve sent a password reset link to your email address.</p>
              <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline text-sm">Back to login</Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" className="mt-1" {...register('email')} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/auth/login" className="text-brand-600 font-semibold hover:underline">Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
