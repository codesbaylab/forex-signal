import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import UserLayoutShell from '@/components/layout/UserLayoutShell'
import { getUserAccess } from '@/lib/access'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, avatarUrl: true, isBanned: true, role: true, trialEndsAt: true },
  })

  if (!profile) redirect('/auth/login')
  if (profile.isBanned) redirect('/banned')
  if (profile.role === 'ADMIN') redirect('/admin')

  const activeSub = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    select: { status: true },
  })

  const access = getUserAccess({ trialEndsAt: profile.trialEndsAt }, activeSub)

  if (!access.hasAccess) {
    redirect('/upgrade')
  }

  return (
    <UserLayoutShell user={profile} access={access}>
      {children}
    </UserLayoutShell>
  )
}
