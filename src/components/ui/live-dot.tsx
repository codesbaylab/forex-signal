import { cn } from '@/lib/utils'

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse-dot', className)} />
  )
}
