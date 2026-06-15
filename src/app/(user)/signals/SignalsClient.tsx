'use client'
import { useState } from 'react'
import Link from 'next/link'

type Signal = {
  id: string
  pair: string
  direction: string
  status: string
  result: string | null
  entryPrice: unknown
  stopLoss: unknown
  takeProfits: unknown
  timeframe: string
  pipsGained: unknown
  createdAt: Date
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-blue-50 text-blue-700',
  TP_HIT: 'bg-green-50 text-green-700',
  SL_HIT: 'bg-red-50 text-red-600',
  CLOSED: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-yellow-50 text-yellow-700',
}

const FILTERS = ['All', 'BUY', 'SELL', 'ACTIVE', 'WIN', 'LOSS']

function getFirstTP(takeProfits: unknown): string {
  if (!Array.isArray(takeProfits) || takeProfits.length === 0) return '-'
  const first = takeProfits[0]
  const val = typeof first === 'number' ? first : (first as { price?: number })?.price
  return val !== undefined && val !== null ? Number(val).toFixed(5) : '-'
}

export default function SignalsClient({ signals }: { signals: Signal[] }) {
  const [active, setActive] = useState('All')

  const filtered = signals.filter((s) => {
    if (active === 'All') return true
    if (active === 'BUY') return s.direction === 'BUY'
    if (active === 'SELL') return s.direction === 'SELL'
    if (active === 'ACTIVE') return s.status === 'ACTIVE'
    if (active === 'WIN') return s.result === 'WIN'
    if (active === 'LOSS') return s.result === 'LOSS'
    return true
  })

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 mr-1">Filter:</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
              active === f
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} signal{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No signals match this filter.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((signal) => (
          <Link key={signal.id} href={`/signals/${signal.id}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-brand-200 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900 text-lg">{signal.pair}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${signal.direction === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {signal.direction}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[signal.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {signal.status === 'TP_HIT' ? 'TP HIT' : signal.status === 'SL_HIT' ? 'SL HIT' : signal.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Entry</p>
                  <p className="text-sm font-semibold text-gray-900">{Number(signal.entryPrice).toFixed(5)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Stop Loss</p>
                  <p className="text-sm font-semibold text-red-600">{Number(signal.stopLoss).toFixed(5)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Take Profit</p>
                  <p className="text-sm font-semibold text-green-600">{getFirstTP(signal.takeProfits)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{signal.timeframe}</span>
                <span className="text-xs text-gray-400">{new Date(signal.createdAt).toLocaleDateString()}</span>
                {signal.pipsGained !== null && (
                  <span className={`text-xs font-semibold ${Number(signal.pipsGained) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(signal.pipsGained) > 0 ? '+' : ''}{Number(signal.pipsGained).toFixed(1)}p
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
