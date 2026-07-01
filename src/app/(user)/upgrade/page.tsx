import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserAccess } from '@/lib/access'
import SubscribePlanButton from '../subscription/SubscribePlanButton'
import Link from 'next/link'

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, trialEndsAt: true },
  })
  if (!profile) redirect('/auth/login')

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    select: { status: true },
  })

  // Already paid — redirect to dashboard
  if (activeSub?.status === 'ACTIVE') redirect('/dashboard')

  const access = getUserAccess({ trialEndsAt: profile.trialEndsAt }, activeSub)

  // Get Pro plan
  const plan = await prisma.plan.findFirst({
    where: { isActive: true, price: { gt: 0 } },
    orderBy: { sortOrder: 'asc' },
  })

  // Get pending commissions
  const pending = await prisma.commission.aggregate({
    where: { recipientUserId: user.id, status: 'PENDING' },
    _sum: { amount: true },
    _count: true,
  })
  const pendingAmount = Number(pending._sum.amount ?? 0)

  const monthlyPrice = plan ? Number(plan.price) : 4
  const annualPrice = monthlyPrice * 12

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Upgrade to Pro</h1>
          {access.inGrace && access.graceEnd && (
            <p className="text-red-600 text-sm mt-2 font-medium">
              Your trial ended. Grace period expires {new Date(access.graceEnd).toLocaleDateString()}.
            </p>
          )}
          {!access.inGrace && !access.inTrial && (
            <p className="text-gray-500 text-sm mt-2">
              Your trial has expired. Upgrade to regain full access.
            </p>
          )}
        </div>

        {/* Pending commissions incentive */}
        {pendingAmount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-green-800 font-bold text-lg">${pendingAmount.toFixed(2)} USDT waiting for you!</p>
            <p className="text-green-700 text-sm mt-1">
              You have {pending._count} pending commission{pending._count !== 1 ? 's' : ''} from your referrals.
              They&apos;ll be released to your wallet the moment you upgrade.
            </p>
          </div>
        )}

        {/* Plan Card */}
        {plan && (
          <div className="bg-white rounded-2xl border-2 border-brand-600 p-6 mb-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">{plan.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{plan.description}</p>
              </div>
              <span className="bg-brand-50 text-brand-700 text-xs font-bold px-2 py-1 rounded-full border border-brand-200">BEST VALUE</span>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">${monthlyPrice}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Billed annually — ${annualPrice}/year total</p>
            </div>

            <ul className="space-y-2 mb-6">
              {(Array.isArray(plan.features) ? plan.features as string[] : []).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-brand-600 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>

            <SubscribePlanButton
              planId={plan.id}
              planName={plan.name}
              price={annualPrice}
              currency="USDT_TRC20"
            />
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Payment is deducted from your wallet balance.{' '}
          <Link href="/wallet/deposit" className="text-brand-600 hover:underline">Deposit USDT</Link> first if needed.
        </p>

        <div className="text-center mt-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
