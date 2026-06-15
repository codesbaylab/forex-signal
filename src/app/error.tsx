'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-8">{error.message || 'An unexpected error occurred.'}</p>
        <Button onClick={reset} className="bg-brand-700 hover:bg-brand-800">Try again</Button>
      </div>
    </div>
  )
}
