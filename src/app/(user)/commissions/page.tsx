import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

export default async function CommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const activeSub = await prisma.subscription.findFirst({ where: { userId: user.id, status: 'ACTIVE' } })
  const isPaid = !!activeSub

  if (!isPaid) {
    return (
      <div>
        <PageHeader title="Commissions" subtitle="Your referral commission earnings" />
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto mt-10">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">💰</span>
          </div>
          <h2 className="font-bold text-gray-900 text-xl mb-2">Pro Feature</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Commission earnings are exclusive to Pro subscribers. Upgrade to unlock the referral program and earn on every subscription your network makes.
          </p>
          <a href="/subscription" className="inline-block bg-brand-700 hover:bg-brand-800 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Upgrade to Pro →
          </a>
        </div>
      </div>
    )
  }

  const commissions = await prisma.commission.findMany({
    where: { recipientUserId: user.id },
    include: {
      source: { select: { id: true, name: true, email: true } },
      subscription: { include: { plan: { select: { name: true, price: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
  const thisMonth = commissions.filter((c) => c.createdAt >= startOfMonth).reduce((sum, c) => sum + Number(c.amount), 0)
  const pending = commissions.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div>
      <PageHeader title="Commissions" subtitle="Your referral commission earnings" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-brand-800 to-brand-600 rounded-2xl p-5 text-center">
          <p className="text-3xl font-extrabold text-white">${totalEarned.toFixed(2)}</p>
          <p className="text-xs text-white/70 mt-1">Total Earned</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-gray-900">${thisMonth.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">This Month</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-orange-500">${pending.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">From User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No commissions yet</td></tr>
              )}
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{c.source.name}</p>
                    <p className="text-xs text-gray-400">{c.source.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">L{c.level}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-700 text-xs">{c.subscription.plan.name}</td>
                  <td className="px-5 py-3 font-semibold text-green-600">+{Number(c.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{c.currency}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
