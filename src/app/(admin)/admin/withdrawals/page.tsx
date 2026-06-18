import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import WithdrawalActions from './WithdrawalActions'

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const withdrawals = await prisma.withdrawal.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    APPROVED: 'bg-green-50 text-green-700',
    REJECTED: 'bg-red-50 text-red-600',
    PROCESSING: 'bg-blue-50 text-blue-700',
  }

  return (
    <div>
      <PageHeader title="Withdrawals" subtitle="Manage withdrawal requests" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Address</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No withdrawals found</td></tr>
              )}
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3"><p className="font-medium text-gray-900">{w.user.name}</p><p className="text-xs text-gray-400">{w.user.email}</p></td>
                  <td className="px-5 py-3 text-xs text-gray-600">{w.currency}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900 text-right">{Number(w.amount).toFixed(2)}</td>
                  <td className="px-5 py-3"><p className="font-mono text-xs text-gray-500 truncate max-w-[120px]">{w.toAddress}</p></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[w.status] ?? 'bg-gray-100 text-gray-500'}`}>{w.status}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    {w.status === 'PENDING' && <WithdrawalActions withdrawalId={w.id} />}
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
