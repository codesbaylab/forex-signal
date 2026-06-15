import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1 },
    },
  })
  if (!profile) redirect('/auth/login')

  const signals = await prisma.signal.findMany({
    where: {
      status: { in: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-blue-50 text-blue-700',
    TP_HIT: 'bg-green-50 text-green-700',
    SL_HIT: 'bg-red-50 text-red-600',
    CLOSED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-yellow-50 text-yellow-700',
  }

  return (
    <div>
      <PageHeader
        title="Signals"
        subtitle="Live and historical forex trading signals"
        actions={
          <Link href="/signals/history">
            <Button variant="outline" className="text-sm">Signal History</Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-500">Filter:</span>
        {['All', 'BUY', 'SELL', 'ACTIVE', 'WIN', 'LOSS'].map((f) => (
          <button key={f} className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors">
            {f}
          </button>
        ))}
      </div>

      {signals.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">No signals available yet. Check back soon.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {signals.map((signal) => (
          <Link key={signal.id} href={`/signals/${signal.id}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:border-brand-200 cursor-pointer group">
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
                  <p className="text-sm font-semibold text-green-600">
                    {Array.isArray(signal.takeProfits) && signal.takeProfits.length > 0
                      ? Number((signal.takeProfits as { price: number }[])[0]?.price ?? 0).toFixed(5)
                      : '-'}
                  </p>
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
    </div>
  )
}
