import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DeletePlanButton from './DeletePlanButton'

export default async function AdminPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } })

  return (
    <div>
      <PageHeader
        title="Plans"
        subtitle="Manage subscription plans"
        actions={<Link href="/admin/plans/new"><Button className="bg-brand-700 hover:bg-brand-800 text-white">New Plan</Button></Link>}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? (plan.features as string[]) : []
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border p-6 ${plan.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-gray-900 mb-1">${Number(plan.price).toFixed(0)}</p>
              <p className="text-xs text-gray-400 mb-4">{plan.durationDays} days · {plan.currency}</p>
              <ul className="space-y-1.5 mb-5 min-h-[80px]">
                {features.map((f, i) => <li key={i} className="text-xs text-gray-600">• {f}</li>)}
              </ul>
              <div className="flex flex-col gap-2">
                <Link href={`/admin/plans/${plan.id}/edit`}>
                  <Button variant="outline" className="w-full text-sm">Edit</Button>
                </Link>
                <DeletePlanButton planId={plan.id} planName={plan.name} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
