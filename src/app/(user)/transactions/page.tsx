import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

const TX_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  COMMISSION: 'Commission',
  SUBSCRIPTION: 'Subscription Payment',
  MANUAL_CREDIT: 'Manual Credit',
  MANUAL_DEBIT: 'Manual Debit',
}

const TX_ICONS: Record<string, string> = {
  DEPOSIT: '↓',
  WITHDRAWAL: '↑',
  TRANSFER_IN: '←',
  TRANSFER_OUT: '→',
  COMMISSION: '★',
  SUBSCRIPTION: '◆',
  MANUAL_CREDIT: '+',
  MANUAL_DEBIT: '-',
}

const CREDIT_TYPES = ['DEPOSIT', 'TRANSFER_IN', 'COMMISSION', 'MANUAL_CREDIT']

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Your complete transaction history" />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Description</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No transactions found</td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${CREDIT_TYPES.includes(tx.type) ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {TX_ICONS[tx.type] ?? '?'}
                      </span>
                      <span className="text-gray-700 font-medium">{TX_LABELS[tx.type] ?? tx.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{tx.note ?? tx.reference ?? '-'}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${CREDIT_TYPES.includes(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                      {CREDIT_TYPES.includes(tx.type) ? '+' : '-'}{Number(tx.amount).toFixed(8)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{tx.currency}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      tx.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                      tx.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
