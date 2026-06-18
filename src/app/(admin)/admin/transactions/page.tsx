import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

const CREDIT_TYPES = ['DEPOSIT', 'TRANSFER_IN', 'COMMISSION', 'MANUAL_CREDIT']

export default async function AdminTransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const transactions = await prisma.transaction.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div>
      <PageHeader title="Transactions" subtitle="All platform transactions" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No transactions</td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{tx.user.name}</p>
                    <p className="text-xs text-gray-400">{tx.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{tx.type}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold text-sm ${CREDIT_TYPES.includes(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                      {CREDIT_TYPES.includes(tx.type) ? '+' : '-'}{Number(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{tx.currency}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tx.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                      tx.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-600'
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
