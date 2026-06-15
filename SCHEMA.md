# Prisma Schema — Full Definition

> Copy this exactly into `prisma/schema.prisma` during Phase 1.
> Do not modify table names — API routes depend on these exact names.

---

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum Role {
  USER
  ADMIN
}

enum Currency {
  USDT_TRC20
  BTC
  BNB_BEP20
}

enum TransactionType {
  DEPOSIT
  WITHDRAWAL
  TRANSFER_IN
  TRANSFER_OUT
  SUBSCRIPTION_PAYMENT
  COMMISSION
  REFUND
  MANUAL_CREDIT
  MANUAL_DEBIT
}

enum TransactionStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

enum DepositStatus {
  WAITING
  CONFIRMING
  CONFIRMED
  SENDING
  PARTIALLY_PAID
  FINISHED
  FAILED
  REFUNDED
  EXPIRED
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
  FAILED
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING
}

enum SignalDirection {
  BUY
  SELL
}

enum SignalTimeframe {
  M1
  M5
  M15
  M30
  H1
  H4
  D1
  W1
}

enum SignalStatus {
  DRAFT
  ACTIVE
  TP_HIT
  SL_HIT
  CLOSED
}

enum SignalResult {
  WIN
  LOSS
  BREAKEVEN
}

enum CommissionType {
  PERCENTAGE
  FIXED
}

enum CommissionStatus {
  PENDING
  PAID
  FAILED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
}

// ─────────────────────────────────────────
// USERS & AUTH
// ─────────────────────────────────────────

model Profile {
  id            String    @id // mirrors Supabase auth.users.id (UUID)
  email         String    @unique
  name          String?
  username      String?   @unique
  avatarUrl     String?
  role          Role      @default(USER)
  referralCode  String    @unique // auto-generated 8-char code on signup
  referredById  String?   // Profile.id of the user who referred this user
  isActive      Boolean   @default(true)
  isBanned      Boolean   @default(false)
  bannedAt      DateTime?
  bannedReason  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  referredBy       Profile?       @relation("Referrals", fields: [referredById], references: [id])
  referrals        Profile[]      @relation("Referrals")
  wallets          Wallet[]
  transactions     Transaction[]
  deposits         Deposit[]
  withdrawals      Withdrawal[]
  subscriptions    Subscription[]
  commissionsEarned Commission[]  @relation("CommissionRecipient")
  commissionsCaused Commission[]  @relation("CommissionSource")
  tickets          SupportTicket[]
  ticketMessages   TicketMessage[]
  notifications    Notification[]
  signalsCreated   Signal[]
  announcements    Announcement[]
  withdrawalsProcessed Withdrawal[] @relation("WithdrawalProcessor")

  @@map("profiles")
}

// ─────────────────────────────────────────
// WALLET SYSTEM
// ─────────────────────────────────────────

model Wallet {
  id            String    @id @default(cuid())
  userId        String
  currency      Currency
  balance       Decimal   @default(0) @db.Decimal(20, 8)
  lockedBalance Decimal   @default(0) @db.Decimal(20, 8) // pending withdrawals
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user         Profile       @relation(fields: [userId], references: [id])
  transactions Transaction[]
  deposits     Deposit[]
  withdrawals  Withdrawal[]

  @@unique([userId, currency])
  @@map("wallets")
}

model Transaction {
  id        String            @id @default(cuid())
  walletId  String
  userId    String
  type      TransactionType
  amount    Decimal           @db.Decimal(20, 8)
  currency  Currency
  status    TransactionStatus @default(COMPLETED)
  reference String?           // external reference (nowpayments id, etc.)
  note      String?
  metadata  Json?
  createdAt DateTime          @default(now())

  wallet Wallet  @relation(fields: [walletId], references: [id])
  user   Profile @relation(fields: [userId], references: [id])

  commissions  Commission[]
  subscription Subscription?

  @@map("transactions")
}

model Deposit {
  id                   String        @id @default(cuid())
  userId               String
  walletId             String
  currency             Currency
  amount               Decimal       @db.Decimal(20, 8) // USD equivalent requested
  nowpaymentsPaymentId String?       @unique
  nowpaymentsOrderId   String?
  payAddress           String?       // crypto address user sends to
  payAmount            Decimal?      @db.Decimal(20, 8) // exact crypto amount to send
  payCurrency          String?       // e.g. "usdttrc20"
  actuallyPaid         Decimal?      @db.Decimal(20, 8)
  status               DepositStatus @default(WAITING)
  txHash               String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  user   Profile @relation(fields: [userId], references: [id])
  wallet Wallet  @relation(fields: [walletId], references: [id])

  @@map("deposits")
}

model Withdrawal {
  id          String           @id @default(cuid())
  userId      String
  walletId    String
  currency    Currency
  amount      Decimal          @db.Decimal(20, 8)
  toAddress   String           // user's external wallet address
  status      WithdrawalStatus @default(PENDING)
  adminNote   String?
  processedBy String?          // admin Profile.id
  processedAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  user      Profile  @relation(fields: [userId], references: [id])
  wallet    Wallet   @relation(fields: [walletId], references: [id])
  processor Profile? @relation("WithdrawalProcessor", fields: [processedBy], references: [id])

  @@map("withdrawals")
}

// ─────────────────────────────────────────
// SUBSCRIPTIONS & PLANS
// ─────────────────────────────────────────

model Plan {
  id           String   @id @default(cuid())
  name         String
  description  String?
  price        Decimal  @db.Decimal(10, 2)
  currency     Currency @default(USDT_TRC20)
  durationDays Int      // e.g. 30, 90, 365
  features     Json     // array of feature strings
  signalAccess Json     @default("[]") // array of signal categories/pairs this plan unlocks
  isActive     Boolean  @default(true)
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subscriptions Subscription[]

  @@map("plans")
}

model Subscription {
  id            String             @id @default(cuid())
  userId        String
  planId        String
  status        SubscriptionStatus @default(PENDING)
  startedAt     DateTime?
  expiresAt     DateTime?
  paidAmount    Decimal            @db.Decimal(10, 2)
  paidCurrency  Currency
  transactionId String?            @unique
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  user        Profile      @relation(fields: [userId], references: [id])
  plan        Plan         @relation(fields: [planId], references: [id])
  transaction Transaction? @relation(fields: [transactionId], references: [id])
  commissions Commission[]

  @@map("subscriptions")
}

// ─────────────────────────────────────────
// SIGNALS
// ─────────────────────────────────────────

model Signal {
  id          String         @id @default(cuid())
  pair        String         // e.g. "EUR/USD", "XAU/USD"
  direction   SignalDirection
  entryPrice  Decimal        @db.Decimal(12, 5)
  takeProfits Json           // array: [{ level: 1, price: 1.08950 }, ...]
  stopLoss    Decimal        @db.Decimal(12, 5)
  timeframe   SignalTimeframe
  status      SignalStatus   @default(DRAFT)
  result      SignalResult?
  pipsGained  Decimal?       @db.Decimal(8, 1)
  analysis    String?        // text analysis / reasoning
  chartUrl    String?        // uploaded chart image URL
  planAccess  Json           @default("[]") // plan ids that can see this signal, empty = all
  publishedAt DateTime?
  closedAt    DateTime?
  createdBy   String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  creator Profile @relation(fields: [createdBy], references: [id])

  @@map("signals")
}

// ─────────────────────────────────────────
// REFERRAL & COMMISSION
// ─────────────────────────────────────────

model ReferralConfig {
  id              String         @id @default(cuid())
  level           Int            @unique // 1, 2, 3, 4, 5...
  commissionType  CommissionType
  commissionValue Decimal        @db.Decimal(10, 4) // e.g. 10.00 for 10% or 5.00 for $5 fixed
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@map("referral_config")
}

model Commission {
  id              String           @id @default(cuid())
  recipientUserId String           // who earns this commission
  sourceUserId    String           // who triggered it (subscribed)
  subscriptionId  String
  level           Int              // which referral level this commission is for
  commissionType  CommissionType
  commissionValue Decimal          @db.Decimal(10, 4)
  amount          Decimal          @db.Decimal(20, 8) // actual USD amount
  currency        Currency
  status          CommissionStatus @default(PENDING)
  transactionId   String?          // links to wallet transaction when paid
  createdAt       DateTime         @default(now())

  recipient    Profile      @relation("CommissionRecipient", fields: [recipientUserId], references: [id])
  source       Profile      @relation("CommissionSource", fields: [sourceUserId], references: [id])
  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  transaction  Transaction? @relation(fields: [transactionId], references: [id])

  @@map("commissions")
}

// ─────────────────────────────────────────
// SUPPORT
// ─────────────────────────────────────────

model SupportTicket {
  id        String         @id @default(cuid())
  userId    String
  subject   String
  status    TicketStatus   @default(OPEN)
  priority  TicketPriority @default(MEDIUM)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user     Profile         @relation(fields: [userId], references: [id])
  messages TicketMessage[]

  @@map("support_tickets")
}

model TicketMessage {
  id        String   @id @default(cuid())
  ticketId  String
  senderId  String
  message   String   @db.Text
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())

  ticket SupportTicket @relation(fields: [ticketId], references: [id])
  sender Profile       @relation(fields: [senderId], references: [id])

  @@map("ticket_messages")
}

// ─────────────────────────────────────────
// NOTIFICATIONS & ANNOUNCEMENTS
// ─────────────────────────────────────────

model Notification {
  id        String   @id @default(cuid())
  userId    String?  // null = broadcast to all
  type      String   // "signal_posted" | "deposit_confirmed" | "commission" | "withdrawal_approved" | etc.
  title     String
  body      String
  isRead    Boolean  @default(false)
  actionUrl String?
  createdAt DateTime @default(now())

  user Profile? @relation(fields: [userId], references: [id])

  @@map("notifications")
}

model Announcement {
  id          String    @id @default(cuid())
  title       String
  body        String    @db.Text
  isPublished Boolean   @default(false)
  publishedAt DateTime?
  createdBy   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  creator Profile @relation(fields: [createdBy], references: [id])

  @@map("announcements")
}

// ─────────────────────────────────────────
// PLATFORM SETTINGS
// ─────────────────────────────────────────

model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("settings")
}

// Default settings to seed:
// maintenance_mode = "false"
// min_withdrawal_usdt = "10"
// min_withdrawal_btc = "0.0005"
// min_withdrawal_bnb = "0.05"
// referral_levels_count = "4"
// site_name = "ForexSignal"
// supported_cryptos = "USDT_TRC20,BTC,BNB_BEP20"
```

---

## Seed Data (run after first migration)

```ts
// prisma/seed.ts
import { PrismaClient, CommissionType } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Default settings
  const settings = [
    { key: 'maintenance_mode', value: 'false' },
    { key: 'site_name', value: 'ForexSignal' },
    { key: 'min_withdrawal_usdt', value: '10' },
    { key: 'min_withdrawal_btc', value: '0.0005' },
    { key: 'min_withdrawal_bnb', value: '0.05' },
    { key: 'referral_levels_count', value: '4' },
    { key: 'supported_cryptos', value: 'USDT_TRC20,BTC,BNB_BEP20' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  // Default referral config (4 levels)
  const levels = [
    { level: 1, commissionType: CommissionType.PERCENTAGE, commissionValue: 10 },
    { level: 2, commissionType: CommissionType.PERCENTAGE, commissionValue: 5 },
    { level: 3, commissionType: CommissionType.PERCENTAGE, commissionValue: 3 },
    { level: 4, commissionType: CommissionType.PERCENTAGE, commissionValue: 2 },
  ]

  for (const l of levels) {
    await prisma.referralConfig.upsert({
      where: { level: l.level },
      update: {},
      create: l,
    })
  }

  // Default plans
  await prisma.plan.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Free',
        description: 'Limited signals, delayed by 1 hour',
        price: 0,
        durationDays: 9999,
        features: ['Up to 3 signals/day', '1 hour delay', 'Major pairs only'],
        signalAccess: ['free'],
      },
      {
        name: 'Basic',
        description: 'Real-time signals on major pairs',
        price: 29,
        durationDays: 30,
        features: ['Unlimited signals', 'Real-time alerts', 'Major pairs', 'Signal history'],
        signalAccess: ['free', 'basic'],
        sortOrder: 1,
      },
      {
        name: 'Pro',
        description: 'All pairs including Gold and indices',
        price: 59,
        durationDays: 30,
        features: ['Everything in Basic', 'Gold & indices', 'VIP analysis', 'Priority support'],
        signalAccess: ['free', 'basic', 'pro'],
        sortOrder: 2,
      },
    ],
  })

  console.log('Seed complete')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Run seed: `npx prisma db seed`
