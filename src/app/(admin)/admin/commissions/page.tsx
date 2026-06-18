import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminCommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const commissions = await prisma.commission.findMany({
    include: {
      recipient: { select: { name: true, email: true } },
      source: { select: { name: true, email: true } },
      subscription: { include: { plan: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const total = commissions.reduce((sum, c) => sum + Number(c.amount), 0)

  return (
    <div>
      <PageHeader title="Commissions" subtitle="All referral commissions" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-2xl font-extrabold text-gray-900">{commissions.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Records</p>
        </div>
        <div className="bg-gradient-to-br from-brand-800 to-brand-600 rounded-2xl p-5">
          <p className="text-2xl font-extrabold text-white">${total.toFixed(2)}</p>
          <p className="text-xs text-white/70 mt-1">Total Paid Out</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Recipient</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">From</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No commissions yet</td></tr>
              )}
              {commissions.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3"><p className="font-medium text-gray-900">{c.recipient.name}</p><p className="text-xs text-gray-400">{c.recipient.email}</p></td>
                  <td className="px-5 py-3"><p className="text-gray-700">{c.source.name}</p></td>
                  <td className="px-5 py-3"><span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">L{c.level}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-600">{c.subscription.plan.name}</td>
                  <td className="px-5 py-3 font-semibold text-green-600 text-right">+{Number(c.amount).toFixed(2)} {c.currency}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
