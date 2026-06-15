import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Users, CreditCard, Clock, DollarSign } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile || profile.role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, activeSubscriptions, pendingWithdrawals, revenueResult, recentUsers, recentWithdrawals] = await Promise.all([
    prisma.profile.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
    prisma.subscription.aggregate({ _sum: { paidAmount: true } }),
    prisma.profile.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  const totalRevenue = Number(revenueResult._sum.paidAmount ?? 0).toFixed(2)

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard title="Total Users" value={totalUsers} featured icon={Users} />
        <StatCard title="Active Subscriptions" value={activeSubscriptions} icon={CreditCard} />
        <StatCard title="Pending Withdrawals" value={pendingWithdrawals} changePositive={false} icon={Clock} />
        <StatCard title="Total Revenue" value={`$${totalRevenue}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Recent Sign-ups</h2>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Pending Withdrawals</h2>
          <div className="space-y-3">
            {recentWithdrawals.length === 0 && <p className="text-sm text-gray-400">No pending withdrawals</p>}
            {recentWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{w.user.name}</p>
                  <p className="text-xs text-gray-400">{w.currency}</p>
                </div>
                <span className="text-sm font-semibold text-orange-600">{Number(w.amount).toFixed(8)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
