'use client'
import { useState } from 'react'
import UserSidebar from './UserSidebar'
import Topbar from './Topbar'
import TrialBanner from './TrialBanner'
import type { Profile } from '@/types'
import type { AccessInfo } from '@/lib/access'

interface Props {
  user: Pick<Profile, 'id' | 'name' | 'email' | 'avatarUrl'>
  access: AccessInfo
  children: React.ReactNode
}

export default function UserLayoutShell({ user, access, children }: Props) {
  const [open, setOpen] = useState(false)

  const showBanner = access.inTrial || access.inGrace

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
        <UserSidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main */}
      <div className="lg:ml-60 flex flex-col min-h-screen">
        {showBanner && (
          <TrialBanner
            daysLeft={access.daysLeft}
            inGrace={access.inGrace}
            graceEnd={access.graceEnd}
          />
        )}
        <Topbar user={user} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-7">{children}</main>
        <footer className="px-4 lg:px-7 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-500">Risk Disclaimer:</span> Trading forex and gold involves substantial risk of loss and is not suitable for all investors. Past performance of signals is not indicative of future results. SignalFX Pro provides signals for informational purposes only and does not constitute financial advice. Never trade with money you cannot afford to lose.
          </p>
        </footer>
      </div>
    </div>
  )
}
