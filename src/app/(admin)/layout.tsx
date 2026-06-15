import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminLayoutShell from '@/components/layout/AdminLayoutShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, avatarUrl: true, role: true },
  })

  if (!profile || profile.role !== 'ADMIN') redirect('/dashboard')

  return (
    <AdminLayoutShell user={profile}>
      {children}
    </AdminLayoutShell>
  )
}
