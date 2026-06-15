import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SignalForm from '../../SignalForm'

export default async function EditSignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const signal = await prisma.signal.findUnique({ where: { id } })
  if (!signal) notFound()

  const plans = await prisma.plan.findMany({ where: { isActive: true } })

  const defaultValues = {
    pair: signal.pair,
    direction: signal.direction,
    entryPrice: Number(signal.entryPrice),
    takeProfits: Array.isArray(signal.takeProfits) ? (signal.takeProfits as { level: number; price: number }[]) : [],
    stopLoss: Number(signal.stopLoss),
    timeframe: signal.timeframe,
    analysis: signal.analysis ?? '',
    planAccess: Array.isArray(signal.planAccess) ? (signal.planAccess as string[]) : [],
    publishNow: signal.status === 'ACTIVE',
  }

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/signals"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Signals</Button></Link>
      </div>
      <PageHeader title={`Edit ${signal.pair}`} subtitle="Update signal details" />
      <SignalForm plans={plans.map((p) => ({ id: p.id, name: p.name }))} defaultValues={defaultValues} signalId={signal.id} />
    </div>
  )
}
