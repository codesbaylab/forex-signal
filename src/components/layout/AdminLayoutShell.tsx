'use client'
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import Topbar from './Topbar'
import type { Profile } from '@/types'

interface Props {
  user: Pick<Profile, 'id' | 'name' | 'email' | 'avatarUrl'>
  children: React.ReactNode
}

export default function AdminLayoutShell({ user, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-60 z-30 transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <AdminSidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Topbar user={user} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-7">{children}</main>
      </div>
    </div>
  )
}
