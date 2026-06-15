import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Manage platform announcements"
        actions={<Link href="/admin/announcements/new"><Button className="bg-brand-700 hover:bg-brand-800 text-white">New Announcement</Button></Link>}
      />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {announcements.length === 0 && (
          <div className="p-12 text-center text-gray-400">No announcements yet</div>
        )}
        {announcements.map((a) => (
          <div key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.isPublished ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {a.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{a.body}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
            </div>
            <Link href={`/admin/announcements/${a.id}/edit`}>
              <Button variant="outline" className="text-xs h-8 px-3">Edit</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
