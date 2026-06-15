import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/layout/AdminSidebar'
import Topbar from '@/components/layout/Topbar'

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
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="ml-60 flex flex-col min-h-screen">
        <Topbar user={profile} />
        <main className="flex-1 p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
