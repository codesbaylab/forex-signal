import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminSignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const signals = await prisma.signal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
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
        subtitle={`${signals.length} signals total`}
        actions={
          <Link href="/admin/signals/new">
            <Button className="bg-brand-700 hover:bg-brand-800 text-white">New Signal</Button>
          </Link>
        }
      />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pair</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Direction</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Result</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pips</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Timeframe</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-gray-900">{s.pair}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${s.direction === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{s.direction}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{s.result ?? '-'}</td>
                  <td className="px-5 py-3 text-xs">{s.pipsGained !== null ? Number(s.pipsGained).toFixed(1) : '-'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{s.timeframe}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/signals/${s.id}/edit`} className="text-xs text-brand-700 font-semibold hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
