import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import SettingsForm from './SettingsForm'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const settings = await prisma.setting.findMany()
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Configure platform-wide settings" />
      <SettingsForm initialSettings={settingsMap} />
    </div>
  )
}
