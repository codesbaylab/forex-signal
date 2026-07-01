'use client'
import Link from 'next/link'

interface Props {
  daysLeft: number
  inGrace: boolean
  graceEnd: Date | null
}

export default function TrialBanner({ daysLeft, inGrace, graceEnd }: Props) {
  if (inGrace) {
    const graceEndStr = graceEnd ? new Date(graceEnd).toLocaleDateString() : ''
    return (
      <div className="bg-red-600 text-white text-sm flex items-center justify-between px-4 py-2.5">
        <span className="font-medium">
          Your trial has ended. You have until {graceEndStr} to upgrade and keep your referral commissions.
        </span>
        <Link
          href="/upgrade"
          className="ml-4 shrink-0 bg-white text-red-700 font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    )
  }

  const urgency = daysLeft <= 2
  return (
    <div className={`${urgency ? 'bg-orange-600' : 'bg-brand-700'} text-white text-sm flex items-center justify-between px-4 py-2.5`}>
      <span className="font-medium">
        {daysLeft === 0
          ? 'Your free trial expires today.'
          : `Free trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`}
        {' '}Upgrade to keep full access and unlock your referral earnings.
      </span>
      <Link
        href="/upgrade"
        className="ml-4 shrink-0 bg-white text-brand-700 font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
      >
        Upgrade
      </Link>
    </div>
  )
}
