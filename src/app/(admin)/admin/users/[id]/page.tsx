import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import AdminUserActions from './AdminUserActions'
import ManualWalletForm from './ManualWalletForm'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const target = await prisma.profile.findUnique({
    where: { id },
    include: {
      wallets: true,
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 5 },
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      tickets: { orderBy: { updatedAt: 'desc' }, take: 5 },
    },
  })
  if (!target) notFound()

  const activeSub = target.subscriptions.find((s) => s.status === 'ACTIVE')

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/users"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Users</Button></Link>
      </div>
      <PageHeader title={target.name ?? target.email} subtitle={target.email} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Profile</h3>
          <div className="space-y-3 text-sm">
            <div><span className="text-gray-400">Username</span><p className="font-medium text-gray-900">{target.username ?? '-'}</p></div>
            <div><span className="text-gray-400">Role</span><p className="font-medium text-gray-900">{target.role}</p></div>
            <div><span className="text-gray-400">Status</span><p className={`font-medium ${target.isBanned ? 'text-red-600' : 'text-green-600'}`}>{target.isBanned ? 'Banned' : 'Active'}</p></div>
            <div><span className="text-gray-400">Joined</span><p className="font-medium text-gray-900">{new Date(target.createdAt).toLocaleDateString()}</p></div>
            <div><span className="text-gray-400">Referral Code</span><p className="font-mono text-xs text-gray-900">{target.referralCode}</p></div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <AdminUserActions userId={target.id} isBanned={target.isBanned} />
          </div>
        </div>

        {/* Wallets */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Wallets</h3>
          <div className="space-y-3">
            {target.wallets.map((w) => (
              <div key={w.id} className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{w.currency}</span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{Number(w.balance).toFixed(2)}</p>
                  {Number(w.lockedBalance) > 0 && <p className="text-xs text-orange-500">Locked: {Number(w.lockedBalance).toFixed(2)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Balance Adjustment */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Adjust Balance</h3>
          <ManualWalletForm userId={target.id} />
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Current Subscription</h3>
          {activeSub ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900 text-lg">{activeSub.plan.name}</p>
              <p className="text-gray-500">Expires: {new Date(activeSub.expiresAt!).toLocaleDateString()}</p>
              <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">ACTIVE</span>
            </div>
          ) : <p className="text-gray-400 text-sm">No active subscription</p>}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {target.transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{tx.type}</span>
              <span className={`font-semibold ${['DEPOSIT','TRANSFER_IN','COMMISSION','MANUAL_CREDIT'].includes(tx.type) ? 'text-green-600' : 'text-red-500'}`}>
                {Number(tx.amount).toFixed(2)} {tx.currency}
              </span>
            </div>
          ))}
          {target.transactions.length === 0 && <p className="text-gray-400 text-sm">No transactions</p>}
        </div>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">Support Tickets</h3>
        <div className="space-y-2">
          {target.tickets.map((t) => (
            <div key={t.id} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{t.subject}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
            </div>
          ))}
          {target.tickets.length === 0 && <p className="text-gray-400 text-sm">No tickets</p>}
        </div>
      </div>
    </div>
  )
}
