'use client'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function ReferralLink({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${referralCode}`
    : `/auth/register?ref=${referralCode}`

  function copy() {
    const fullUrl = `${window.location.origin}/auth/register?ref=${referralCode}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1">
      <p className="text-xs text-gray-500 mb-2">Your referral link</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate border border-gray-100">
          {url}
        </div>
        <button
          onClick={copy}
          className="flex-shrink-0 p-2 rounded-lg bg-gray-50 hover:bg-brand-50 hover:text-brand-700 text-gray-500 border border-gray-100 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}
