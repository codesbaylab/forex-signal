import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminDepositsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const deposits = await prisma.deposit.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    CONFIRMING: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-green-50 text-green-700',
    FINISHED: 'bg-green-50 text-green-700',
    FAILED: 'bg-red-50 text-red-600',
    EXPIRED: 'bg-gray-100 text-gray-500',
  }

  return (
    <div>
      <PageHeader title="Deposits" subtitle="All deposit records" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount (USD)</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Pay Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">TX Hash</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3"><p className="font-medium text-gray-900">{d.user.name}</p><p className="text-xs text-gray-400">{d.user.email}</p></td>
                  <td className="px-5 py-3 text-xs text-gray-600">{d.currency}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">${Number(d.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-gray-600">{Number(d.payAmount).toFixed(8)}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[d.status] ?? 'bg-gray-100 text-gray-500'}`}>{d.status}</span></td>
                  <td className="px-5 py-3"><p className="font-mono text-xs text-gray-500 truncate max-w-[100px]">{d.txHash ?? '-'}</p></td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
