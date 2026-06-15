'use client'

import { Bell, Mail, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Profile } from '@/types'

interface TopbarProps {
  user: Pick<Profile, 'id' | 'name' | 'email' | 'avatarUrl'>
}

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return email.slice(0, 2).toUpperCase()
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="sticky top-0 z-9 bg-white border-b border-gray-100 h-16 flex items-center px-7 gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2 flex-1 max-w-xs text-gray-500">
        <Search className="w-4 h-4 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search signals, pairs..."
          className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <Mail className="w-4 h-4" />
        </button>

        <Link href="/notifications">
          <button className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
        </Link>

        <Link href="/profile">
          <div className="flex items-center gap-2.5 pl-3 pr-1 py-1 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-sm font-semibold text-gray-800">{user.name ?? user.email.split('@')[0]}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.avatarUrl
                ? <Image src={user.avatarUrl} alt="" width={32} height={32} className="rounded-full object-cover" />
                : getInitials(user.name ?? null, user.email)
              }
            </div>
          </div>
        </Link>
      </div>
    </header>
  )
}
