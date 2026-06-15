import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function SignalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) notFound()

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-50 text-blue-700',
    TP_HIT: 'bg-green-50 text-green-700',
    SL_HIT: 'bg-red-50 text-red-600',
    CLOSED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-yellow-50 text-yellow-700',
  }

  const takeProfits = Array.isArray(signal.takeProfits)
    ? (signal.takeProfits as (number | { level: number; price: number })[]).map((tp, i) =>
        typeof tp === 'number' ? { level: i + 1, price: tp } : tp
      )
    : []

  return (
    <div>
      <div className="mb-5">
        <Link href="/signals">
          <Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Signals
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900">{signal.pair}</h1>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${signal.direction === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {signal.direction}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{signal.timeframe}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[signal.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {signal.status === 'TP_HIT' ? 'TP HIT' : signal.status === 'SL_HIT' ? 'SL HIT' : signal.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-7">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Entry Price</p>
            <p className="text-xl font-bold text-gray-900">{Number(signal.entryPrice).toFixed(5)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs text-red-400 mb-1">Stop Loss</p>
            <p className="text-xl font-bold text-red-600">{Number(signal.stopLoss).toFixed(5)}</p>
          </div>
          {takeProfits.map((tp) => (
            <div key={tp.level} className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-500 mb-1">Take Profit {tp.level}</p>
              <p className="text-xl font-bold text-green-700">{Number(tp.price).toFixed(5)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Published</p>
            <p className="font-medium text-gray-900">{new Date(signal.createdAt).toLocaleString()}</p>
          </div>
          {signal.result && (
            <div>
              <p className="text-gray-400 text-xs mb-1">Result</p>
              <span className={`font-semibold ${signal.result === 'WIN' ? 'text-green-700' : signal.result === 'LOSS' ? 'text-red-600' : 'text-gray-600'}`}>
                {signal.result}
              </span>
            </div>
          )}
          {signal.pipsGained !== null && (
            <div>
              <p className="text-gray-400 text-xs mb-1">Pips</p>
              <p className={`font-semibold ${Number(signal.pipsGained) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {Number(signal.pipsGained) > 0 ? '+' : ''}{Number(signal.pipsGained).toFixed(1)}
              </p>
            </div>
          )}
        </div>
      </div>

      {signal.analysis && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-3">Analysis</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{signal.analysis}</p>
        </div>
      )}
    </div>
  )
}
