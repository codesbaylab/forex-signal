import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import AnnouncementCard from './AnnouncementCard'

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const announcements = await prisma.announcement.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  })

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Latest news and updates" />
      <div className="space-y-4">
        {announcements.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">No announcements yet</div>
        )}
        {announcements.map((a) => (
          <AnnouncementCard key={a.id} id={a.id} title={a.title} body={a.body} date={a.publishedAt?.toISOString() ?? a.createdAt.toISOString()} />
        ))}
      </div>
    </div>
  )
}
