import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export default async function SignalHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const signals = await prisma.signal.findMany({
    where: { status: { in: ['TP_HIT', 'SL_HIT', 'CLOSED'] } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  const wins = signals.filter((s) => s.result === 'WIN').length
  const winRate = signals.length > 0 ? Math.round((wins / signals.length) * 100) : 0

  return (
    <div>
      <PageHeader title="Signal History" subtitle="Past signals and their outcomes" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-gray-900">{signals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Signals</p>
        </div>
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-green-700">{wins}</p>
          <p className="text-xs text-green-600 mt-1">Wins</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-brand-700">{winRate}%</p>
          <p className="text-xs text-gray-500 mt-1">Win Rate</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pair</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Direction</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Timeframe</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Result</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pips</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/signals/${signal.id}`} className="font-semibold text-gray-900 hover:text-brand-700">{signal.pair}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${signal.direction === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {signal.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{signal.timeframe}</span>
                  </td>
                  <td className="px-5 py-3">
                    {signal.result ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        signal.result === 'WIN' ? 'bg-green-50 text-green-700' :
                        signal.result === 'LOSS' ? 'bg-red-50 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {signal.result}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-3">
                    {signal.pipsGained !== null ? (
                      <span className={`font-semibold text-sm ${Number(signal.pipsGained) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {Number(signal.pipsGained) > 0 ? '+' : ''}{Number(signal.pipsGained).toFixed(1)}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(signal.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {signals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No historical signals found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
