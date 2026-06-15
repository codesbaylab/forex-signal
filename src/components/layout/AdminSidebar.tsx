'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, TrendingUp, Star, CreditCard,
  ArrowDownToLine, ArrowUpFromLine, Receipt, GitBranch,
  DollarSign, Wallet, Settings, Bell, BarChart3,
  HelpCircle, Megaphone, LogOut, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Signals', href: '/admin/signals', icon: TrendingUp },
  { label: 'Plans', href: '/admin/plans', icon: Star },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Deposits', href: '/admin/deposits', icon: ArrowDownToLine },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: ArrowUpFromLine },
  { label: 'Transactions', href: '/admin/transactions', icon: Receipt },
  { label: 'Wallets', href: '/admin/wallets', icon: Wallet },
  { label: 'Referral Config', href: '/admin/referral-config', icon: GitBranch },
  { label: 'Commissions', href: '/admin/commissions', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Support', href: '/admin/support', icon: HelpCircle },
  { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-0 top-0 w-60 h-screen bg-white border-r border-gray-100 flex flex-col z-10">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-gray-900 block">ForexSignal</span>
          <span className="text-[10px] font-semibold text-brand-700 uppercase tracking-wider">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-3">
        {adminNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 mx-2.5 rounded-xl cursor-pointer text-sm font-medium transition-all relative',
                active
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              )}>
                {active && (
                  <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-brand-700 rounded-r-full" />
                )}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-4 py-2.5 mx-2.5 mt-2 rounded-xl cursor-pointer text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all w-[calc(100%-20px)]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
