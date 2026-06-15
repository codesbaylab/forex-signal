import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Users, TrendingUp, BarChart2, DollarSign } from 'lucide-react'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, newUsers30d, totalSubs, activeRevenue, signals, winSignals] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.aggregate({ where: { startedAt: { gte: startOfMonth } }, _sum: { paidAmount: true } }),
    prisma.signal.count({ where: { status: { in: ['TP_HIT', 'SL_HIT'] } } }),
    prisma.signal.count({ where: { result: 'WIN' } }),
  ])

  const winRate = signals > 0 ? Math.round((winSignals / signals) * 100) : 0
  const monthRevenue = Number(activeRevenue._sum.paidAmount ?? 0).toFixed(2)

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Platform performance overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard title="Total Users" value={totalUsers} featured icon={Users} />
        <StatCard title="New (30d)" value={newUsers30d} change="vs last month" icon={TrendingUp} />
        <StatCard title="Active Subs" value={totalSubs} icon={BarChart2} />
        <StatCard title="Revenue (MTD)" value={`$${monthRevenue}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Signal Win Rate</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-brand-700">{winRate}%</p>
              <p className="text-sm text-gray-400 mt-1">Overall Win Rate</p>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Wins</span><span>{winSignals}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${winRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Losses</span><span>{signals - winSignals}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${100 - winRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Growth Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">{totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New last 30d</span>
              <span className="font-semibold text-green-600">+{newUsers30d}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Subscriptions</span>
              <span className="font-semibold text-gray-900">{totalSubs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Month Revenue</span>
              <span className="font-semibold text-brand-700">${monthRevenue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
