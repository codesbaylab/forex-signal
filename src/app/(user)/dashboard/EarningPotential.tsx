'use client'
import Link from 'next/link'

interface Props {
  trialDownlineCount: number
  pendingCommissions: number
  annualPrice: number
  l1Rate: number
  inTrial: boolean
}

export default function EarningPotential({ trialDownlineCount, pendingCommissions, annualPrice, l1Rate, inTrial }: Props) {
  if (!inTrial && pendingCommissions === 0 && trialDownlineCount === 0) return null

  const potentialL1 = trialDownlineCount * annualPrice * (l1Rate / 100)

  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white/80 text-xs font-medium">Earning Potential</p>
          <p className="text-2xl font-extrabold mt-0.5">
            ${(pendingCommissions + potentialL1).toFixed(2)}
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            {pendingCommissions > 0 && `$${pendingCommissions.toFixed(2)} pending + `}
            {trialDownlineCount > 0 && `$${potentialL1.toFixed(2)} if ${trialDownlineCount} referral${trialDownlineCount !== 1 ? 's' : ''} upgrade`}
          </p>
        </div>
        <div className="text-3xl">💰</div>
      </div>
      {inTrial && (
        <Link
          href="/upgrade"
          className="inline-block bg-white text-orange-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors mt-1"
        >
          Upgrade to collect →
        </Link>
      )}
    </div>
  )
}
