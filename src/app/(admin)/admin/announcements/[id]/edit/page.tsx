import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import AnnouncementForm from '../../AnnouncementForm'

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const announcement = await prisma.announcement.findUnique({ where: { id } })
  if (!announcement) notFound()

  return (
    <div>
      <div className="mb-5"><Link href="/admin/announcements"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Announcements</Button></Link></div>
      <PageHeader title={`Edit: ${announcement.title}`} subtitle="" />
      <AnnouncementForm
        defaultValues={{ title: announcement.title, body: announcement.body, isPublished: announcement.isPublished }}
        announcementId={announcement.id}
      />
    </div>
  )
}
