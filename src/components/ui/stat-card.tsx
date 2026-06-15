import { cn } from '@/lib/utils'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changePositive?: boolean
  featured?: boolean
  icon?: LucideIcon
  href?: string
}

export function StatCard({ title, value, change, changePositive = true, featured = false }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl p-5 border transition-shadow hover:shadow-md cursor-default',
      featured
        ? 'bg-gradient-to-br from-brand-800 to-brand-600 border-none text-white'
        : 'bg-white border-gray-100'
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs font-semibold', featured ? 'text-white/75' : 'text-gray-500')}>
          {title}
        </span>
        <div className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center border text-xs',
          featured ? 'border-white/30 bg-white/15 text-white' : 'border-gray-200 text-gray-500'
        )}>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className={cn('text-3xl font-extrabold tracking-tight mb-2.5', featured ? 'text-white' : 'text-gray-900')}>
        {value}
      </div>

      {change && (
        <div className={cn('flex items-center gap-1 text-xs', featured ? 'text-white/70' : 'text-gray-500')}>
          <span className={cn('font-semibold', featured ? 'text-white/90' : changePositive ? 'text-brand-600' : 'text-red-500')}>
            {changePositive ? '↑' : '↓'} {change}
          </span>
        </div>
      )}
    </div>
  )
}
