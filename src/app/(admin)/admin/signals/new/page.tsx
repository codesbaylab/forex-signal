import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import SignalForm from '../SignalForm'

export default async function NewSignalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const plans = await prisma.plan.findMany({ where: { isActive: true } })

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/signals"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Signals</Button></Link>
      </div>
      <PageHeader title="New Signal" subtitle="Create a new trading signal" />
      <SignalForm plans={plans.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  )
}
