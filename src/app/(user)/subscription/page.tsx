import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import SubscriptionPlansClient from './SubscriptionPlansClient'

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

  const discountSetting = await prisma.setting.findUnique({ where: { key: 'annual_discount_pct' } })
  const annualDiscountPct = Number(discountSetting?.value ?? 17)

  const serialized = plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    price: Number(p.price),
    durationDays: p.durationDays,
    features: Array.isArray(p.features) ? (p.features as string[]) : [],
    currency: p.currency,
  }))

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Choose your billing plan" />

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

      <SubscriptionPlansClient plans={serialized} currentPlanId={activeSub?.planId} annualDiscountPct={annualDiscountPct} />
    </div>
  )
}
