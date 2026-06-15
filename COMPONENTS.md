# Component Map

> Every reusable component listed here. Build these once, reuse everywhere.
> All components use TypeScript with proper prop types. No `any`.

---

## Layout Components

### `src/components/layout/UserSidebar.tsx`
- Props: `user: Profile`
- Contains: logo, nav items with icons, upgrade card at bottom
- Active state: based on `usePathname()`
- Mobile: renders as Sheet (shadcn) triggered by hamburger

### `src/components/layout/AdminSidebar.tsx`
- Props: none (reads session internally)
- Contains: admin nav items (different set from user sidebar)
- No upgrade card

### `src/components/layout/Topbar.tsx`
- Props: `user: Profile`
- Contains: search input, notification bell with unread count, user chip/avatar
- Notification dropdown: uses Popover with recent notifications list

### `src/components/layout/PageHeader.tsx`
- Props: `title: string, subtitle?: string, actions?: React.ReactNode`
- Renders the page title + subtitle + right-side action buttons slot

---

## Signal Components

### `src/components/signals/SignalCard.tsx`
- Props: `signal: Signal, compact?: boolean`
- Shows: pair, direction badge, entry/TP/SL, timeframe, status badge, time ago
- Click → navigate to signal detail

### `src/components/signals/SignalBadge.tsx`
- Props: `direction: 'BUY' | 'SELL'`
- Green up arrow for BUY, red down arrow for SELL

### `src/components/signals/StatusBadge.tsx`
- Props: `status: SignalStatus | SignalResult`
- Maps status → color: WIN=green, LOSS=red, LIVE=blue, CLOSED=gray

### `src/components/signals/SignalFilters.tsx`
- Props: `onFilter: (filters) => void`
- Contains: pair select, timeframe select, direction select, status select, date range

### `src/components/signals/SignalForm.tsx`
- Props: `signal?: Signal, onSubmit: (data) => void, isLoading: boolean`
- Used in admin create/edit signal pages
- Validates with Zod

---

## Wallet Components

### `src/components/wallet/WalletCard.tsx`
- Props: `wallet: Wallet`
- Shows: currency icon, balance, locked balance, deposit/withdraw buttons

### `src/components/wallet/CurrencySelector.tsx`
- Props: `value: Currency, onChange: (c: Currency) => void, disabled?: boolean`
- Renders: USDT TRC20, BTC, BNB with icons

### `src/components/wallet/TransactionRow.tsx`
- Props: `transaction: Transaction`
- Shows: type icon, description, amount (green/red), date, status badge

### `src/components/wallet/DepositModal.tsx`
- Props: `open: boolean, onClose: () => void, wallet: Wallet`
- Step 1: select currency + amount
- Step 2: show QR code + address + countdown timer
- Step 3: confirmation / pending state

### `src/components/wallet/WithdrawForm.tsx`
- Props: `wallets: Wallet[], onSubmit: (data) => void`
- Fields: currency select, amount, destination address
- Shows available balance dynamically

### `src/components/wallet/TransferForm.tsx`
- Props: `wallets: Wallet[], onSubmit: (data) => void`
- Fields: recipient username/email, currency, amount, note
- Live recipient lookup as user types

---

## Referral Components

### `src/components/referral/ReferralLink.tsx`
- Props: `code: string`
- Shows referral URL with copy button and share options

### `src/components/referral/ReferralTree.tsx`
- Props: `levels: ReferralLevel[]`
- Renders each level as a collapsible row showing referred users + commission earned

### `src/components/referral/CommissionRow.tsx`
- Props: `commission: Commission`
- Shows: source user, level, amount, subscription plan, date, status

### `src/components/referral/LevelBar.tsx`
- Props: `level: number, count: number, max: number, earned: number`
- Progress bar showing referrals per level (as seen in dashboard preview)

---

## Chart Components

### `src/components/charts/SignalPerformanceChart.tsx`
- Props: `data: Array<{ day: string; wins: number; losses: number }>`
- Recharts BarChart, grouped bars, green wins / gray losses

### `src/components/charts/WinRateDonut.tsx`
- Props: `wins: number, losses: number, breakeven: number`
- Recharts PieChart with donut cutout, center percentage label

### `src/components/charts/RevenueChart.tsx`
- Props: `data: Array<{ date: string; revenue: number }>`, `period: '30d' | '90d' | '1y'`
- Recharts AreaChart with gradient fill

### `src/components/charts/UserGrowthChart.tsx`
- Props: `data: Array<{ date: string; users: number }>`
- Recharts LineChart

---

## Admin Components

### `src/components/admin/UserRow.tsx`
- Props: `user: Profile & { subscription: Subscription | null }`
- Table row: avatar, name, email, role, plan, status, actions dropdown

### `src/components/admin/WithdrawalRow.tsx`
- Props: `withdrawal: Withdrawal & { user: Profile; wallet: Wallet }`
- Shows: user, currency, amount, address (truncated), status, approve/reject buttons

### `src/components/admin/StatCard.tsx`
- Props: `title: string, value: string | number, change?: string, featured?: boolean, icon: LucideIcon`
- Reusable for both user dashboard and admin dashboard

### `src/components/admin/DataTable.tsx`
- Props: `columns: Column[], data: T[], pagination: Pagination, onPageChange: fn`
- Generic table with pagination, used across all admin list pages

---

## Shared / UI Components

### `src/components/ui/CryptoIcon.tsx`
- Props: `currency: Currency, size?: number`
- Returns the correct icon/logo for each crypto

### `src/components/ui/LiveDot.tsx`
- No props — pulsing green dot for "live" signals

### `src/components/ui/MarketSession.tsx`
- No props — shows London/NY/Tokyo/Sydney open/closed based on current UTC time

### `src/components/ui/EmptyState.tsx`
- Props: `icon: LucideIcon, title: string, description: string, action?: React.ReactNode`
- Used when lists are empty

### `src/components/ui/LoadingSpinner.tsx`
- Props: `size?: 'sm' | 'md' | 'lg'`

### `src/components/ui/ConfirmDialog.tsx`
- Props: `open, onClose, onConfirm, title, description, confirmLabel, variant: 'default' | 'danger'`
- Wraps shadcn AlertDialog

### `src/components/ui/CopyButton.tsx`
- Props: `text: string`
- Copies to clipboard, shows check icon briefly

### `src/components/ui/AddressDisplay.tsx`
- Props: `address: string`
- Shows truncated address + copy button + optional QR code

---

## Hooks

### `src/hooks/useUser.ts`
```ts
// Returns current authenticated user profile
// Reads from Supabase session + fetches Profile from DB
const { user, isLoading, error } = useUser()
```

### `src/hooks/useWallet.ts`
```ts
// Returns user wallets, auto-refetches every 30s
const { wallets, totalUsdBalance, isLoading, refresh } = useWallet()
```

### `src/hooks/useSignals.ts`
```ts
// Returns paginated signals with filter support
const { signals, pagination, isLoading, setFilters } = useSignals()
```

### `src/hooks/useReferral.ts`
```ts
// Returns referral stats and downline tree
const { stats, tree, commissions, isLoading } = useReferral()
```

### `src/hooks/useNotifications.ts`
```ts
// Returns notifications + unread count, marks as read
const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
```

---

## Key Library Files

### `src/lib/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### `src/lib/supabase/server.ts`
```ts
// Server-side Supabase client using @supabase/ssr
// Used in Server Components and API routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
```

### `src/lib/supabase/client.ts`
```ts
// Browser-side Supabase client
// Used in Client Components
import { createBrowserClient } from '@supabase/ssr'
```

### `src/lib/referral/commission.ts`
```ts
// distributeCommissions(subscriptionId: string): Promise<void>
// Walks up the referral chain and credits commissions
// Called after subscription is activated
```

### `src/lib/wallet/transactions.ts`
```ts
// creditWallet(userId, currency, amount, type, reference): Promise<Transaction>
// debitWallet(userId, currency, amount, type, reference): Promise<Transaction>
// Both use Prisma transactions to ensure atomicity
// Balance never goes below 0 — throws if insufficient funds
```

### `src/lib/validations/`
```
auth.ts        → RegisterSchema, LoginSchema
signal.ts      → CreateSignalSchema, UpdateSignalSchema
wallet.ts      → DepositSchema, WithdrawSchema, TransferSchema
subscription.ts → SubscribeSchema
admin.ts       → UpdateUserSchema, UpdateWithdrawalSchema, ReferralConfigSchema
```

### `src/middleware.ts`
```ts
// Protected routes: /dashboard, /signals, /wallet, /referral, etc.
// Admin routes: /admin/*
// Redirect unauthenticated users to /auth/login
// Redirect non-admin users away from /admin/*
// Uses @supabase/ssr updateSession
```
