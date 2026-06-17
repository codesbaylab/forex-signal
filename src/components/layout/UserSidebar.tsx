'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Wallet, ArrowDownToLine,
  ArrowUpFromLine, ArrowLeftRight, Receipt, Star,
  Users, Settings, HelpCircle, LogOut, Megaphone, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Signals', href: '/signals', icon: TrendingUp },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Deposit', href: '/wallet/deposit', icon: ArrowDownToLine },
  { label: 'Withdraw', href: '/wallet/withdraw', icon: ArrowUpFromLine },
  { label: 'Transfer', href: '/wallet/transfer', icon: ArrowLeftRight },
  { label: 'Transactions', href: '/transactions', icon: Receipt },
  { label: 'Subscription', href: '/subscription', icon: Star },
  { label: 'Referral', href: '/referral', icon: Users },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Announcements', href: '/announcements', icon: Megaphone },
]

const generalItems = [
  { label: 'Settings', href: '/profile', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
]

export default function UserSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function handleNav() {
    onClose?.()
  }

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-gray-900">SignalFX Pro</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-5 pt-2 pb-2">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (pathname.startsWith(item.href + '/') &&
              !navItems.some(other => other.href !== item.href && other.href.length > item.href.length && pathname.startsWith(other.href)))
          return (
            <Link key={item.href} href={item.href} onClick={handleNav}>
              <div className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 mx-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all relative',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}>
                {isActive && (
                  <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-brand-700 rounded-r-full" />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-5 pt-5 pb-2">General</p>
        {generalItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={handleNav}>
              <div className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 mx-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all',
                active ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-2.5 mx-2.5 rounded-xl cursor-pointer text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all w-[calc(100%-20px)]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      {/* Upgrade card */}
      <div className="p-4 flex-shrink-0">
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl p-4 text-white">
          <h4 className="text-sm font-bold mb-1">Upgrade to Pro</h4>
          <p className="text-xs opacity-75 mb-3 leading-relaxed">Get real-time signals on all pairs and unlimited history.</p>
          <Link href="/subscription" onClick={handleNav}>
            <button className="w-full bg-white text-brand-800 rounded-lg py-2 text-xs font-bold">
              Upgrade Now
            </button>
          </Link>
        </div>
      </div>
    </aside>
  )
}
