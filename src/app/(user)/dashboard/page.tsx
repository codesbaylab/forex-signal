import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      wallets: true,
      subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1 },
    },
  })
  if (!profile) redirect('/auth/login')

  const totalBalance = profile.wallets.reduce((sum, w) => sum + Number(w.balance), 0)
  const activeSubscription = profile.subscriptions[0] ?? null

  const activeSignals = await prisma.signal.count({ where: { status: 'ACTIVE' } })

  const allSignals = await prisma.signal.findMany({
    where: { status: { in: ['TP_HIT', 'SL_HIT'] } },
    select: { result: true },
  })
  const wins = allSignals.filter((s) => s.result === 'WIN').length
  const winRate = allSignals.length > 0 ? Math.round((wins / allSignals.length) * 100) : 0

  const commissions = await prisma.commission.aggregate({
    where: { recipientUserId: user.id, status: 'PAID' },
    _sum: { amount: true },
  })
  const commissionEarned = Number(commissions._sum.amount ?? 0).toFixed(2)

  const recentSignals = await prisma.signal.findMany({
    where: { status: { in: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED'] } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const totalReferrals = await prisma.profile.count({ where: { referredById: user.id } })

  const marketSessions = [
    { name: 'Sydney', isOpen: false },
    { name: 'Tokyo', isOpen: true },
    { name: 'London', isOpen: true },
    { name: 'New York', isOpen: false },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your trading overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard title="Wallet Balance" value={`$${totalBalance.toFixed(2)}`} featured change="Multi-currency" changePositive icon={Wallet} />
        <StatCard title="Active Signals" value={activeSignals} change="Live right now" changePositive icon={Activity} />
        <StatCard title="Win Rate" value={`${winRate}%`} change={`${allSignals.length} total signals`} changePositive icon={TrendingUp} />
        <StatCard title="Commissions" value={`$${commissionEarned}`} change="Total earned" changePositive icon={DollarSign} />
      </div>

      {/* Active Subscription + Market Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-7">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Current Plan</h2>
            <Link href="/subscription"><Button variant="ghost" className="text-brand-600 text-xs h-7 px-3">Upgrade</Button></Link>
          </div>
          {activeSubscription ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg">{activeSubscription.plan.name}</p>
                <p className="text-sm text-gray-500">Expires: {new Date(activeSubscription.expiresAt!).toLocaleDateString()}</p>
              </div>
              <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">ACTIVE</span>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm mb-3">No active subscription</p>
              <Link href="/subscription"><Button className="bg-brand-700 hover:bg-brand-800 text-white text-sm">Choose a Plan</Button></Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Market Sessions</h2>
          <div className="space-y-3">
            {marketSessions.map((session) => (
              <div key={session.name} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{session.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${session.isOpen ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {session.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Signals</h2>
          <Link href="/signals"><Button variant="ghost" className="text-brand-600 text-xs h-7 px-3">View all</Button></Link>
        </div>
        <div className="space-y-3">
          {recentSignals.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">No signals yet</p>
          )}
          {recentSignals.map((signal) => (
            <Link key={signal.id} href={`/signals/${signal.id}`} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${signal.direction === 'BUY' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {signal.direction}
                </span>
                <span className="font-semibold text-gray-900 text-sm">{signal.pair}</span>
                <span className="text-xs text-gray-400">{signal.timeframe}</span>
              </div>
              <div className="flex items-center gap-3">
                {signal.pipsGained !== null && (
                  <span className={`text-xs font-semibold ${Number(signal.pipsGained) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(signal.pipsGained) > 0 ? '+' : ''}{Number(signal.pipsGained).toFixed(1)} pips
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  signal.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' :
                  signal.result === 'WIN' ? 'bg-green-50 text-green-700' :
                  signal.result === 'LOSS' ? 'bg-red-50 text-red-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {signal.status === 'ACTIVE' ? 'LIVE' : signal.result ?? signal.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Referral Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Referral Program</h2>
          <Link href="/referral"><Button variant="ghost" className="text-brand-600 text-xs h-7 px-3">Manage</Button></Link>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-gray-900">{totalReferrals}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Referrals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-gray-900">${commissionEarned}</p>
            <p className="text-xs text-gray-500 mt-0.5">Earned</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-2">Your referral link</p>
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">
              {process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.com'}/auth/register?ref={profile.referralCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
