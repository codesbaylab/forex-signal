import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const subscriptions = await prisma.subscription.findMany({
    include: { user: { select: { name: true, email: true } }, plan: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
    CANCELLED: 'bg-red-50 text-red-600',
  }

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="All platform subscriptions" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Started</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Expires</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3"><p className="font-medium text-gray-900">{s.user.name}</p><p className="text-xs text-gray-400">{s.user.email}</p></td>
                  <td className="px-5 py-3 text-sm text-gray-700">{s.plan.name}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[s.status] ?? 'bg-gray-100 text-gray-500'}`}>{s.status}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-400">{s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : '-'}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{Number(s.paidAmount).toFixed(2)} {s.paidCurrency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
