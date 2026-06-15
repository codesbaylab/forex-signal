'use client'
import { useState } from 'react'
import Link from 'next/link'

type NotificationData = {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  actionUrl: string | null
  createdAt: string
}

export default function NotificationItem({ notification }: { notification: NotificationData }) {
  const [read, setRead] = useState(notification.isRead)

  const typeIcons: Record<string, string> = {
    SIGNAL: '📡',
    DEPOSIT: '💰',
    WITHDRAWAL: '↑',
    COMMISSION: '⭐',
    SUBSCRIPTION: '◆',
    ANNOUNCEMENT: '📢',
    SYSTEM: '⚙️',
  }

  async function markRead() {
    if (read) return
    setRead(true)
    await fetch(`/api/notifications/${notification.id}/read`, { method: 'PUT' })
  }

  const content = (
    <div onClick={markRead} className={`flex items-start gap-4 px-5 py-4 transition-colors ${read ? 'bg-white' : 'bg-brand-50'} hover:bg-gray-50 cursor-pointer`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${read ? 'bg-gray-100' : 'bg-brand-100'}`}>
        {typeIcons[notification.type] ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</p>
          {!read && <span className="w-2 h-2 bg-brand-700 rounded-full flex-shrink-0" />}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
      </div>
    </div>
  )

  return notification.actionUrl ? (
    <Link href={notification.actionUrl}>{content}</Link>
  ) : content
}
