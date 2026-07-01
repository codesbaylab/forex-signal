import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAccess } from '@/lib/access'
import { PageHeader } from '@/components/ui/page-header'
import { CopyButton } from '@/components/ui/copy-button'
import ReferralCalculator from './ReferralCalculator'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, referralCode: true, trialEndsAt: true },
  })
  if (!profile) redirect('/auth/login')

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    select: { status: true },
  })

  const access = getUserAccess({ trialEndsAt: profile.trialEndsAt }, activeSub)

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
    select: { sourceUserId: true, amount: true, level: true, status: true },
  })

  const totalEarned = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + Number(c.amount), 0)
  const pendingEarned = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + Number(c.amount), 0)
  const activeSubscribers = downline.filter((d) => d.subscriptions.length > 0).length

  const earnedByUser: Record<string, number> = {}
  for (const c of commissions.filter(c => c.status === 'PAID')) {
    earnedByUser[c.sourceUserId] = (earnedByUser[c.sourceUserId] ?? 0) + Number(c.amount)
  }

  // L1 commission rate for calculator
  const l1Config = await prisma.referralConfig.findUnique({ where: { level: 1 } })
  const l1Rate = l1Config ? Number(l1Config.commissionValue) : 35

  const planPrice = await prisma.plan.findFirst({
    where: { isActive: true, price: { gt: 0 } },
    select: { price: true },
  })
  const annualPrice = planPrice ? Number(planPrice.price) * 12 : 48

  return (
    <div>
      <PageHeader title="Referral Program" subtitle="Earn commissions by referring traders" />

      {/* Trial notice */}
      {access.inTrial && !access.isPaid && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-amber-800 text-sm font-medium">
            You are on a free trial. Your referral link is active now — commissions from your referrals will be held as
            <strong> pending</strong> and released to your wallet the moment you upgrade to Pro.
          </p>
        </div>
      )}

      {/* Referral Link */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 font-mono text-sm text-gray-700 truncate">{referralLink}</div>
          <CopyButton text={referralLink} />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Share this link. When someone registers and subscribes, you earn a commission at every level.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
        {pendingEarned > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <p className="text-3xl font-extrabold text-amber-700">${pendingEarned.toFixed(2)}</p>
            <p className="text-xs text-amber-600 mt-1">Pending (upgrade to release)</p>
          </div>
        )}
      </div>

      {/* Commission structure */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Commission Structure</h2>
        <div className="grid grid-cols-7 gap-2">
          {[
            { level: 'L1', pct: 35 },
            { level: 'L2', pct: 20 },
            { level: 'L3', pct: 15 },
            { level: 'L4', pct: 12 },
            { level: 'L5', pct: 8 },
            { level: 'L6', pct: 6 },
            { level: 'L7', pct: 4 },
          ].map(({ level, pct }) => (
            <div key={level} className="text-center bg-brand-50 rounded-xl py-3">
              <p className="text-xs font-bold text-brand-700">{level}</p>
              <p className="text-lg font-extrabold text-brand-900 mt-1">{pct}%</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          100% of each subscription fee flows back to your upline network — across 7 levels.
        </p>
      </div>

      {/* Earnings Calculator */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-1">Earnings Calculator</h2>
        <p className="text-xs text-gray-400 mb-4">Estimate your income based on how many people you refer</p>
        <ReferralCalculator annualPrice={annualPrice} l1Rate={l1Rate} />
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
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Earned</th>
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
                      <span className="text-xs text-gray-400">Trial</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(ref.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 font-semibold text-green-600 text-right">${(earnedByUser[ref.id] ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
