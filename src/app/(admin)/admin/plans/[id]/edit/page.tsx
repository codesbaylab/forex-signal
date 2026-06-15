import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PlanForm from '../../PlanForm'

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) notFound()

  const defaultValues = {
    name: plan.name,
    description: plan.description ?? '',
    price: Number(plan.price),
    currency: plan.currency,
    durationDays: plan.durationDays,
    features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  }

  return (
    <div>
      <div className="mb-5"><Link href="/admin/plans"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Plans</Button></Link></div>
      <PageHeader title={`Edit ${plan.name}`} subtitle="Update plan details" />
      <PlanForm defaultValues={defaultValues} planId={plan.id} />
    </div>
  )
}
