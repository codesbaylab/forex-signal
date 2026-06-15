import type {
  Profile,
  Wallet,
  Transaction,
  Deposit,
  Withdrawal,
  Plan,
  Subscription,
  Signal,
  ReferralConfig,
  Commission,
  SupportTicket,
  TicketMessage,
  Notification,
  Announcement,
  Setting,
} from '@prisma/client'

// Re-export Prisma types
export type {
  Profile,
  Wallet,
  Transaction,
  Deposit,
  Withdrawal,
  Plan,
  Subscription,
  Signal,
  ReferralConfig,
  Commission,
  SupportTicket,
  TicketMessage,
  Notification,
  Announcement,
  Setting,
}

export type {
  Role,
  Currency,
  TransactionType,
  TransactionStatus,
  DepositStatus,
  WithdrawalStatus,
  SubscriptionStatus,
  SignalDirection,
  SignalTimeframe,
  SignalStatus,
  SignalResult,
  CommissionType,
  CommissionStatus,
  TicketStatus,
  TicketPriority,
} from '@prisma/client'

// Extended types with relations
export type ProfileWithWallets = Profile & { wallets: Wallet[] }

export type SubscriptionWithPlan = Subscription & { plan: Plan }

export type SignalWithCreator = Signal & { creator: Pick<Profile, 'id' | 'name' | 'email'> }

export type WithdrawalWithUser = Withdrawal & {
  user: Pick<Profile, 'id' | 'name' | 'email' | 'username'>
  wallet: Pick<Wallet, 'currency' | 'balance'>
}

export type CommissionWithDetails = Commission & {
  recipient: Pick<Profile, 'id' | 'name' | 'email'>
  source: Pick<Profile, 'id' | 'name' | 'email'>
  subscription: Subscription & { plan: Pick<Plan, 'name' | 'price'> }
}

export type TicketWithMessages = SupportTicket & {
  user: Pick<Profile, 'id' | 'name' | 'email' | 'avatarUrl'>
  messages: (TicketMessage & { sender: Pick<Profile, 'id' | 'name' | 'avatarUrl'> })[]
}

// API response types
export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: string; code?: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Pagination
export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  items: T[]
  pagination: PaginationMeta
}

// Wallet summary
export type WalletSummary = {
  currency: string
  balance: string
  lockedBalance: string
  usdValue: string
}

// Referral tree node
export type ReferralNode = {
  level: number
  user: Pick<Profile, 'id' | 'name' | 'email' | 'username' | 'avatarUrl'>
  subscription: SubscriptionWithPlan | null
  commission: string
  referrals: ReferralNode[]
}

// Referral stats
export type ReferralStats = {
  totalReferrals: number
  activeSubscribers: number
  totalEarned: string
  byLevel: Array<{ level: number; count: number; earned: string }>
}

// Dashboard stats
export type DashboardStats = {
  walletBalance: string
  activeSignals: number
  winRate: number
  commissionEarned: string
  activeSubscription: SubscriptionWithPlan | null
}

// Admin analytics
export type AdminOverview = {
  totalUsers: number
  activeSubscriptions: number
  pendingWithdrawals: number
  totalRevenue: string
  newUsersToday: number
  signalsToday: number
}

// Market session
export type MarketSession = {
  name: string
  timezone: string
  open: string
  close: string
  isOpen: boolean
}

// NowPayments payment creation response
export type NowPaymentsPayment = {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
}

// NowPayments IPN payload
export type NowPaymentsIPN = {
  payment_id: number
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
}
