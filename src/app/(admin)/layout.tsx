import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/layout/AdminSidebar'
import LayoutShell from '@/components/layout/LayoutShell'

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
    <LayoutShell
      sidebar={(onClose) => <AdminSidebar onClose={onClose} />}
      user={profile}
    >
      {children}
    </LayoutShell>
  )
}
