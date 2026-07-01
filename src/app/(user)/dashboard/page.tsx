import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAccess } from '@/lib/access'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { TrendingUp, DollarSign, Activity, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ReferralLink from './ReferralLink'
import EarningPotential from './EarningPotential'

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

  const activeSubscription = profile.subscriptions[0] ?? null
  const access = getUserAccess({ trialEndsAt: profile.trialEndsAt }, activeSubscription)

  const usdtWallet = profile.wallets.find((w) => w.currency === 'USDT_TRC20')
  const usdtBalance = Number(usdtWallet?.balance ?? 0)

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

  // Earning potential — trial downline who haven't subscribed yet
  const trialDownline = await prisma.profile.count({
    where: {
      referredById: user.id,
      subscriptions: { none: { status: 'ACTIVE' } },
      trialEndsAt: { not: null },
    },
  })
  const pendingCommissions = await prisma.commission.aggregate({
    where: { recipientUserId: user.id, status: 'PENDING' },
    _sum: { amount: true },
  })
  const pendingAmount = Number(pendingCommissions._sum.amount ?? 0)
  const l1Config = await prisma.referralConfig.findUnique({ where: { level: 1 } })
  const l1Rate = l1Config ? Number(l1Config.commissionValue) : 35
  const planPrice = await prisma.plan.findFirst({
    where: { isActive: true, price: { gt: 0 } },
    select: { price: true },
  })
  const annualPrice = planPrice ? Number(planPrice.price) * 12 : 48

  // Real market session hours (UTC)
  const nowUTC = new Date()
  const h = nowUTC.getUTCHours()
  const m = nowUTC.getUTCMinutes()
  const hm = h * 60 + m
  const marketSessions = [
    { name: 'Sydney',   isOpen: hm >= 21 * 60 + 0 || hm < 6 * 60 + 0 },
    { name: 'Tokyo',    isOpen: hm >= 23 * 60 + 0 || hm < 8 * 60 + 0 },
    { name: 'London',   isOpen: hm >= 7 * 60 + 0 && hm < 16 * 60 + 0 },
    { name: 'New York', isOpen: hm >= 12 * 60 + 0 && hm < 21 * 60 + 0 },
  ]

  const pricesSetting = await prisma.setting.findUnique({ where: { key: 'forex_prices' } })
  const liveprices: Record<string, { price: string; pct: string; dir: string; updatedAt: number }> =
    pricesSetting?.value ? JSON.parse(pricesSetting.value) : {}

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your trading overview" />

      {/* Wallet Balance */}
      <div className="bg-brand-700 rounded-2xl p-5 mb-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-brand-200 text-xs font-medium">Wallet Balance</p>
            <p className="text-3xl font-extrabold mt-1">{usdtBalance.toFixed(2)} <span className="text-brand-300 text-lg font-semibold">USDT</span></p>
            <p className="text-brand-300 text-xs mt-0.5">TRC20 Network</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">₮</div>
        </div>
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
          <Link href="/wallet/deposit">
            <button className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
              <ArrowDownToLine className="w-3 h-3" /> Deposit
            </button>
          </Link>
          <Link href="/wallet/withdraw">
            <button className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
              <ArrowUpFromLine className="w-3 h-3" /> Withdraw
            </button>
          </Link>
          <Link href="/wallet/transfer">
            <button className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
              <ArrowLeftRight className="w-3 h-3" /> Transfer
            </button>
          </Link>
          <Link href="/wallet" className="ml-auto">
            <button className="text-xs text-brand-200 hover:text-white font-medium transition-colors">View all →</button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <StatCard title="Active Signals" value={activeSignals} change="Live right now" changePositive icon={Activity} />
        <StatCard title="Win Rate" value={`${winRate}%`} change={`${allSignals.length} total signals`} changePositive icon={TrendingUp} />
        <StatCard title="Commissions" value={`$${commissionEarned}`} change="Total earned" changePositive icon={DollarSign} />
      </div>

      {/* Earning Potential */}
      <div className="mb-7">
        <EarningPotential
          trialDownlineCount={trialDownline}
          pendingCommissions={pendingAmount}
          annualPrice={annualPrice}
          l1Rate={l1Rate}
          inTrial={access.inTrial}
        />
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

      {/* Live Prices */}
      {Object.keys(liveprices).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Live Prices</h2>
            <div className="text-right">
              <p className="text-xs text-gray-400">Updates every 5 min</p>
              {Object.values(liveprices)[0]?.updatedAt && (
                <p className="text-xs text-gray-300">
                  Last updated: {new Date(Object.values(liveprices)[0].updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(liveprices).map(([pair, data]) => {
              const up = data.dir === 'up'
              const pct = parseFloat(data.pct)
              const p = parseFloat(data.price)
              const formatted = pair.includes('JPY') ? p.toFixed(3) : pair.startsWith('XAU') ? p.toFixed(2) : p.toFixed(5)
              return (
                <div key={pair} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{pair}</p>
                  <p className="font-bold text-gray-900 text-sm">{formatted}</p>
                  <p className={`text-xs font-semibold mt-0.5 ${up ? 'text-green-600' : 'text-red-500'}`}>
                    {up ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
          <ReferralLink referralCode={profile.referralCode ?? ''} />
        </div>
      </div>
    </div>
  )
}
