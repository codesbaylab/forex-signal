import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.example.com'}/auth/register?ref=${profile.referralCode}`

  const downline = await prisma.profile.findMany({
    where: { referredById: user.id },
    include: {
      subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  const commissions = await prisma.commission.findMany({
    where: { recipientUserId: user.id },
    select: { sourceUserId: true, amount: true, level: true },
  })

  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
  const activeSubscribers = downline.filter((d) => d.subscriptions.length > 0).length

  const earnedByUser: Record<string, number> = {}
  for (const c of commissions) {
    earnedByUser[c.sourceUserId] = (earnedByUser[c.sourceUserId] ?? 0) + Number(c.amount)
  }

  return (
    <div>
      <PageHeader title="Referral Program" subtitle="Earn commissions by referring traders" />

      {/* Referral Link */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 truncate">{referralLink}</div>
          <CopyButton text={referralLink} />
        </div>
        <p className="text-xs text-gray-400 mt-3">Share this link. When someone registers and subscribes, you earn a commission.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-gray-900">{downline.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Referrals</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
          <p className="text-3xl font-extrabold text-green-700">{activeSubscribers}</p>
          <p className="text-xs text-gray-500 mt-1">Active Subscribers</p>
        </div>
        <div className="bg-gradient-to-br from-brand-800 to-brand-600 rounded-2xl p-5 text-center">
          <p className="text-3xl font-extrabold text-white">${totalEarned.toFixed(2)}</p>
          <p className="text-xs text-white/70 mt-1">Total Earned</p>
        </div>
      </div>

      {/* Downline Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Your Referrals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Earned</th>
              </tr>
            </thead>
            <tbody>
              {downline.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No referrals yet. Share your link to start earning!</td></tr>
              )}
              {downline.map((ref) => (
                <tr key={ref.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{ref.name}</p>
                    <p className="text-xs text-gray-400">{ref.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    {ref.subscriptions[0] ? (
                      <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">{ref.subscriptions[0].plan.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Free</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(ref.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-semibold text-green-600">${(earnedByUser[ref.id] ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
