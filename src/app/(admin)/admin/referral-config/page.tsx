import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import ReferralConfigForm from './ReferralConfigForm'

export default async function ReferralConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const levels = await prisma.referralConfig.findMany({ orderBy: { level: 'asc' } })

  return (
    <div>
      <PageHeader title="Referral Config" subtitle="Configure referral commission levels" />
      <ReferralConfigForm initialLevels={levels.map((l) => ({
        level: l.level,
        commissionType: l.commissionType,
        commissionValue: Number(l.commissionValue),
        isActive: l.isActive,
      }))} />
    </div>
  )
}
