import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const CURRENCY_ICONS: Record<string, string> = { USDT_TRC20: '₮' }
const CURRENCY_LABELS: Record<string, string> = { USDT_TRC20: 'USDT (TRC20)' }

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const wallets = await prisma.wallet.findMany({ where: { userId: user.id, currency: 'USDT_TRC20' } })
  const recentDeposits = await prisma.deposit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  const recentTxs = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const txTypeLabels: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER_IN: 'Transfer In',
    TRANSFER_OUT: 'Transfer Out',
    COMMISSION: 'Commission',
    SUBSCRIPTION: 'Subscription',
    MANUAL_CREDIT: 'Manual Credit',
    MANUAL_DEBIT: 'Manual Debit',
  }

  return (
    <div>
      <PageHeader title="Wallet" subtitle="Manage your crypto wallets" />

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 gap-5 mb-7">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-lg">
                {CURRENCY_ICONS[wallet.currency] ?? '?'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{CURRENCY_LABELS[wallet.currency] ?? wallet.currency}</p>
                <p className="text-xs text-gray-400">{wallet.currency}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1">Available Balance</p>
              <p className="text-2xl font-extrabold text-gray-900">{Number(wallet.balance).toFixed(8)}</p>
            </div>
            {Number(wallet.lockedBalance) > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Locked</p>
                <p className="text-sm font-semibold text-orange-500">{Number(wallet.lockedBalance).toFixed(8)}</p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Link href="/wallet/deposit">
                <Button className="bg-brand-700 hover:bg-brand-800 text-white text-xs h-8 px-3">Deposit</Button>
              </Link>
              <Link href="/wallet/withdraw">
                <Button variant="outline" className="text-xs h-8 px-3">Withdraw</Button>
              </Link>
              <Link href="/wallet/transfer">
                <Button variant="ghost" className="text-xs h-8 px-3 text-gray-600">Transfer</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Deposit Requests */}
      {recentDeposits.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-7">
          <h2 className="font-bold text-gray-900 mb-4">Deposit Requests</h2>
          <div className="space-y-3">
            {recentDeposits.map((d) => {
              const statusConfig: Record<string, { label: string; cls: string }> = {
                WAITING:    { label: 'Pending Review', cls: 'bg-yellow-50 text-yellow-700' },
                PENDING:    { label: 'Processing',    cls: 'bg-blue-50 text-blue-700' },
                CONFIRMING: { label: 'Confirming',    cls: 'bg-blue-50 text-blue-700' },
                CONFIRMED:  { label: 'Confirmed',     cls: 'bg-green-50 text-green-700' },
                FINISHED:   { label: 'Completed',     cls: 'bg-green-50 text-green-700' },
                FAILED:     { label: 'Rejected',      cls: 'bg-red-50 text-red-600' },
                EXPIRED:    { label: 'Expired',       cls: 'bg-gray-100 text-gray-500' },
              }
              const s = statusConfig[d.status] ?? { label: d.status, cls: 'bg-gray-100 text-gray-500' }
              return (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {Number(d.amount).toFixed(2)} USDT
                    </p>
                    <p className="text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Transactions</h2>
          <Link href="/transactions"><Button variant="ghost" className="text-brand-600 text-xs h-7 px-3">View all</Button></Link>
        </div>
        <div className="space-y-3">
          {recentTxs.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No transactions yet</p>}
          {recentTxs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{txTypeLabels[tx.type] ?? tx.type}</p>
                {tx.note && <p className="text-xs text-gray-400">{tx.note}</p>}
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${['DEPOSIT','TRANSFER_IN','COMMISSION','MANUAL_CREDIT'].includes(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                  {['DEPOSIT','TRANSFER_IN','COMMISSION','MANUAL_CREDIT'].includes(tx.type) ? '+' : '-'}{Number(tx.amount).toFixed(8)} {tx.currency}
                </p>
                <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
