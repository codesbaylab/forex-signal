import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import UserSidebar from '@/components/layout/UserSidebar'
import LayoutShell from '@/components/layout/LayoutShell'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, avatarUrl: true, isBanned: true, role: true },
  })

  if (!profile) redirect('/auth/login')
  if (profile.isBanned) redirect('/banned')
  if (profile.role === 'ADMIN') redirect('/admin')

  return (
    <LayoutShell
      sidebar={(onClose) => <UserSidebar onClose={onClose} />}
      user={profile}
    >
      {children}
    </LayoutShell>
  )
}
