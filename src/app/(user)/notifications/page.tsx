import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import MarkAllReadButton from './MarkAllReadButton'
import NotificationItem from './NotificationItem'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        actions={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {notifications.length === 0 && (
          <div className="p-12 text-center text-gray-400 text-sm">No notifications yet</div>
        )}
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={{ id: n.id, type: n.type, title: n.title, body: n.body, isRead: n.isRead, actionUrl: n.actionUrl, createdAt: n.createdAt.toISOString() }} />
        ))}
      </div>
    </div>
  )
}
