import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import SubscribePlanButton from './SubscribePlanButton'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    include: { plan: true },
  })

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Manage your plan" />

      {activeSub && (
        <div className="bg-gradient-to-br from-brand-800 to-brand-600 rounded-2xl p-6 text-white mb-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">Current Plan</p>
              <p className="text-2xl font-extrabold">{activeSub.plan.name}</p>
              <p className="text-white/70 text-sm mt-1">Expires {new Date(activeSub.expiresAt!).toLocaleDateString()}</p>
            </div>
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">ACTIVE</span>
          </div>
        </div>
      )}

      <h2 className="font-bold text-gray-900 mb-4">{activeSub ? 'Upgrade Your Plan' : 'Choose a Plan'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : []
          const isCurrent = activeSub?.planId === plan.id
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col ${isCurrent ? 'border-brand-700 ring-1 ring-brand-700' : 'border-gray-100'}`}>
              {isCurrent && <span className="text-xs text-brand-700 font-semibold mb-3">Current Plan</span>}
              <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
              {plan.description && <p className="text-sm text-gray-500 mb-3">{plan.description}</p>}
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-extrabold text-gray-900">${Number(plan.price).toFixed(0)}</span>
                <span className="text-sm text-gray-500">/ {plan.durationDays}d</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
              {!isCurrent && Number(plan.price) > 0 && (
                <SubscribePlanButton planId={plan.id} planName={plan.name} price={Number(plan.price)} currency={plan.currency} />
              )}
              {Number(plan.price) === 0 && !isCurrent && (
                <span className="text-center text-sm text-gray-400">Free plan</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
