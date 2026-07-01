'use client'
import { useState } from 'react'

interface Props {
  annualPrice: number
  l1Rate: number
}

const LEVELS = [
  { label: 'L1', pct: 35, multiplier: 1 },
  { label: 'L2', pct: 20, multiplier: 5 },
  { label: 'L3', pct: 15, multiplier: 25 },
  { label: 'L4', pct: 12, multiplier: 125 },
  { label: 'L5', pct: 8,  multiplier: 625 },
  { label: 'L6', pct: 6,  multiplier: 3125 },
  { label: 'L7', pct: 4,  multiplier: 15625 },
]

export default function ReferralCalculator({ annualPrice }: Props) {
  const [directReferrals, setDirectReferrals] = useState(5)

  // Estimate: each person refers same number down (geometric with factor = directReferrals)
  const rows = LEVELS.map((lvl, i) => {
    const count = Math.round(Math.pow(directReferrals, i + 1))
    const income = count * annualPrice * (lvl.pct / 100)
    return { ...lvl, count, income }
  })

  const totalAnnual = rows.reduce((s, r) => s + r.income, 0)
  const totalMonthly = totalAnnual / 12

  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Direct referrals you bring in</label>
          <span className="text-brand-700 font-extrabold text-lg">{directReferrals}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={directReferrals}
          onChange={(e) => setDirectReferrals(Number(e.target.value))}
          className="w-full accent-brand-700"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span><span>20</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 text-xs font-semibold text-gray-500">Level</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500">Rate</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500">Est. Members</th>
              <th className="text-right py-2 text-xs font-semibold text-gray-500">Annual Income</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-50">
                <td className="py-2 font-semibold text-brand-700">{row.label}</td>
                <td className="py-2 text-right text-gray-500">{row.pct}%</td>
                <td className="py-2 text-right text-gray-700">{row.count.toLocaleString()}</td>
                <td className="py-2 text-right font-semibold text-green-700">${row.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-brand-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-600 font-medium">Estimated Annual Income</p>
          <p className="text-2xl font-extrabold text-brand-900">${totalAnnual.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-600 font-medium">Per Month</p>
          <p className="text-xl font-bold text-brand-800">${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        * Assumes each member refers the same number of people. Illustrative only.
      </p>
    </div>
  )
}
