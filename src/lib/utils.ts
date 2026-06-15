import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import Decimal from 'decimal.js'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | Decimal, decimals = 2): string {
  const num = new Decimal(amount.toString())
  return num.toFixed(decimals)
}

export function formatUSD(amount: number | string | Decimal): string {
  const num = parseFloat(new Decimal(amount.toString()).toFixed(2))
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    USDT_TRC20: 'USDT (TRC20)',
    BTC: 'Bitcoin (BTC)',
    BNB_BEP20: 'BNB (BEP20)',
  }
  return labels[currency] ?? currency
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USDT_TRC20: 'USDT',
    BTC: 'BTC',
    BNB_BEP20: 'BNB',
  }
  return symbols[currency] ?? currency
}
