# Forex Signal Platform — Master Project Document

> **Any new session: read this file first, then check BUILD_STATUS.md for current progress.**

---

## What We Are Building

A SaaS forex trading signal platform with:
- Live forex signals generated from technical indicators (RSI, MACD, EMA crossovers)
- Crypto-native wallet system (USDT TRC20, BTC, BNB/BEP20)
- Subscription plans paid from internal wallet
- Unilevel MLM referral system with configurable levels and commissions
- Full admin panel for managing everything
- No KYC required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| ORM + Migrations | Prisma |
| Crypto Payments | NowPayments API |
| Forex Data | Twelve Data API (free tier) |
| Signal Engine | `technicalindicators` npm package |
| Deployment | Vercel |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

---

## Prerequisites — Must Complete Before Running Project

### 1. Node.js
- Required: Node.js 18.17+ 
- Check: `node --version`

### 2. Supabase Project
- Create project at https://supabase.com
- Go to **Project Settings → API** and collect:
  - `Project URL`
  - `anon public key`
  - `service_role key` (keep secret)
- Go to **Project Settings → Database** and collect:
  - `Connection string` (Transaction pooler — port 6543) → used for Prisma `DATABASE_URL`
  - `Direct connection string` (port 5432) → used for Prisma `DIRECT_URL`
- In Supabase Auth settings:
  - Enable Email provider
  - Set Site URL to your domain (or localhost:3000 for dev)
  - Set Redirect URLs: `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback`
- **IMPORTANT**: Disable Supabase's auto-generated schema enforcement — Prisma manages schema, not Supabase migrations

### 3. NowPayments Account
- Sign up at https://nowpayments.io
- Get API Key from dashboard
- Set IPN callback URL: `https://yourdomain.com/api/webhooks/nowpayments`
- Enable currencies: USDT (TRC20), BTC, BNB (BEP20)
- For local testing use NowPayments Sandbox mode

### 4. Twelve Data API (Forex Data)
- Sign up at https://twelvedata.com
- Get free API key (800 requests/day free tier)

---

## Environment Variables

Create `.env` file in project root (never commit this file):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma — use Transaction Pooler URL for DATABASE_URL (port 6543)
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
# Direct URL for migrations only
DIRECT_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# NowPayments
NOWPAYMENTS_API_KEY=your-nowpayments-api-key
NOWPAYMENTS_IPN_SECRET=your-ipn-secret-key
NOWPAYMENTS_SANDBOX=true  # set to false in production

# Twelve Data (Forex)
TWELVE_DATA_API_KEY=your-twelve-data-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

Create `.env.example` with the same keys but empty values — this IS committed to git.

---

## Folder Structure

```
forex-signal-platform/
├── prisma/
│   ├── schema.prisma          # Full DB schema
│   └── migrations/            # Auto-generated migration files
├── src/
│   ├── app/
│   │   ├── (public)/          # Landing, auth pages (no auth required)
│   │   │   ├── page.tsx                  # Landing page
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── reset-password/page.tsx
│   │   │   │   └── callback/route.ts     # Supabase auth callback
│   │   ├── (user)/            # Protected user area
│   │   │   ├── layout.tsx               # User layout with sidebar/nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── signals/
│   │   │   │   ├── page.tsx             # Signals feed
│   │   │   │   └── [id]/page.tsx        # Signal detail
│   │   │   ├── signals/history/page.tsx
│   │   │   ├── wallet/
│   │   │   │   ├── page.tsx             # Wallet overview
│   │   │   │   ├── deposit/page.tsx
│   │   │   │   ├── withdraw/page.tsx
│   │   │   │   └── transfer/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── subscription/page.tsx
│   │   │   ├── referral/page.tsx
│   │   │   ├── commissions/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── support/
│   │   │   │   ├── page.tsx             # Ticket list
│   │   │   │   └── [id]/page.tsx        # Ticket detail
│   │   │   └── announcements/page.tsx
│   │   ├── (admin)/           # Protected admin area
│   │   │   ├── layout.tsx               # Admin layout
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx             # Admin dashboard
│   │   │   │   ├── users/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── signals/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   ├── plans/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   ├── subscriptions/page.tsx
│   │   │   │   ├── deposits/page.tsx
│   │   │   │   ├── withdrawals/page.tsx
│   │   │   │   ├── transactions/page.tsx
│   │   │   │   ├── referral-config/page.tsx
│   │   │   │   ├── commissions/page.tsx
│   │   │   │   ├── wallets/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   ├── notifications/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   ├── support/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── announcements/
│   │   │   │       ├── page.tsx
│   │   │   │       └── new/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── callback/route.ts
│   │   │   ├── signals/
│   │   │   │   ├── route.ts             # GET list, POST create
│   │   │   │   └── [id]/route.ts        # GET, PUT, DELETE
│   │   │   ├── wallet/
│   │   │   │   ├── deposit/route.ts
│   │   │   │   ├── withdraw/route.ts
│   │   │   │   └── transfer/route.ts
│   │   │   ├── subscriptions/
│   │   │   │   └── route.ts
│   │   │   ├── referral/
│   │   │   │   └── route.ts
│   │   │   ├── admin/
│   │   │   │   ├── users/route.ts
│   │   │   │   ├── wallets/route.ts
│   │   │   │   └── withdrawals/route.ts
│   │   │   └── webhooks/
│   │   │       └── nowpayments/route.ts  # NowPayments IPN callback
│   │   ├── layout.tsx                    # Root layout
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── maintenance/page.tsx
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── UserSidebar.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── signals/
│   │   │   ├── SignalCard.tsx
│   │   │   ├── SignalBadge.tsx
│   │   │   └── SignalFilters.tsx
│   │   ├── wallet/
│   │   │   ├── WalletCard.tsx
│   │   │   ├── TransactionRow.tsx
│   │   │   └── CryptoSelector.tsx
│   │   ├── referral/
│   │   │   ├── ReferralTree.tsx
│   │   │   └── CommissionRow.tsx
│   │   └── charts/
│   │       ├── RevenueChart.tsx
│   │       └── SignalPerformanceChart.tsx
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   ├── server.ts                 # Server client
│   │   │   └── middleware.ts             # Auth middleware helper
│   │   ├── nowpayments/
│   │   │   ├── client.ts                 # NowPayments API wrapper
│   │   │   └── webhook.ts                # IPN signature verification
│   │   ├── signals/
│   │   │   └── engine.ts                 # Technical indicator signal engine
│   │   ├── forex/
│   │   │   └── twelvedata.ts             # Twelve Data API wrapper
│   │   ├── referral/
│   │   │   └── commission.ts             # Unilevel commission distributor
│   │   ├── wallet/
│   │   │   └── transactions.ts           # Wallet debit/credit helpers
│   │   └── validations/
│   │       ├── auth.ts                   # Zod schemas for auth
│   │       ├── signal.ts
│   │       ├── wallet.ts
│   │       └── subscription.ts
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useWallet.ts
│   │   └── useSignals.ts
│   ├── store/
│   │   └── useAppStore.ts               # Zustand global store
│   ├── types/
│   │   └── index.ts                     # Shared TypeScript types
│   └── middleware.ts                    # Next.js middleware for auth protection
├── public/
│   └── images/
├── .env                                 # Never commit
├── .env.example                         # Commit this
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── PROJECT.md                           # This file
└── BUILD_STATUS.md                      # Current build progress
```

---

## Database Schema (Prisma)

### Users & Auth
- `profiles` — extends Supabase auth.users (id mirrors auth.users.id)
  - id, email, name, username, avatar_url, role (USER | ADMIN), referral_code, referred_by_id, is_active, is_banned, created_at, updated_at

### Wallet System
- `wallets` — one per user per currency
  - id, user_id, currency (USDT_TRC20 | BTC | BNB_BEP20), balance (Decimal), locked_balance, created_at, updated_at

- `transactions` — all wallet movements
  - id, wallet_id, user_id, type (DEPOSIT | WITHDRAWAL | TRANSFER_IN | TRANSFER_OUT | SUBSCRIPTION_PAYMENT | COMMISSION | REFUND | MANUAL_CREDIT | MANUAL_DEBIT), amount, currency, status (PENDING | COMPLETED | FAILED | CANCELLED), reference, metadata (JSON), created_at

- `deposits`
  - id, user_id, wallet_id, currency, amount, nowpayments_payment_id, nowpayments_order_id, pay_address, pay_amount, pay_currency, status (WAITING | CONFIRMING | CONFIRMED | SENDING | PARTIALLY_PAID | FINISHED | FAILED | REFUNDED | EXPIRED), tx_hash, created_at, updated_at

- `withdrawals`
  - id, user_id, wallet_id, currency, amount, to_address, status (PENDING | APPROVED | REJECTED | PROCESSING | COMPLETED | FAILED), admin_note, processed_by, processed_at, created_at, updated_at

### Subscriptions & Plans
- `plans`
  - id, name, description, price (Decimal), currency, duration_days, features (JSON), is_active, created_at, updated_at

- `subscriptions`
  - id, user_id, plan_id, status (ACTIVE | EXPIRED | CANCELLED | PENDING), started_at, expires_at, paid_amount, paid_currency, transaction_id, created_at, updated_at

### Signals
- `signals`
  - id, pair (e.g. EUR/USD), direction (BUY | SELL), entry_price, take_profit (JSON array — multiple TPs), stop_loss, timeframe (M1 | M5 | M15 | M30 | H1 | H4 | D1), status (ACTIVE | TP_HIT | SL_HIT | CLOSED | DRAFT), result (WIN | LOSS | BREAKEVEN | NULL), pips_gained, analysis, chart_url, plan_required (plan ids JSON — which plans can see this signal), published_at, closed_at, created_by, created_at, updated_at

### Referral & Commission
- `referral_config`
  - id, level (1,2,3...), commission_type (PERCENTAGE | FIXED), commission_value (Decimal), is_active, created_at, updated_at
  - Admin manages rows here. E.g. level 1 = 10%, level 2 = 5%, level 3 = 2%

- `commissions`
  - id, recipient_user_id, source_user_id, subscription_id, level, commission_type, commission_value, amount, currency, status (PENDING | PAID | FAILED), transaction_id, created_at

### Support
- `support_tickets`
  - id, user_id, subject, status (OPEN | IN_PROGRESS | CLOSED), priority (LOW | MEDIUM | HIGH), created_at, updated_at

- `support_messages`
  - id, ticket_id, sender_id, message, is_admin, created_at

### Notifications & Announcements
- `notifications`
  - id, user_id (null = broadcast), type, title, body, is_read, action_url, created_at

- `announcements`
  - id, title, body, is_published, published_at, created_by, created_at, updated_at

### Platform Settings
- `settings`
  - id, key (unique), value, created_at, updated_at
  - Keys: `maintenance_mode`, `min_withdrawal_usdt`, `min_withdrawal_btc`, `min_withdrawal_bnb`, `supported_cryptos`, `site_name`, `referral_levels_count`

---

## Business Logic Rules

### Referral System
1. User signs up via referral link (`?ref=CODE`)
2. `referred_by_id` is set on their profile
3. When user subscribes and payment completes:
   - Walk up the upline chain (referred_by → their referred_by → etc.) for N levels (N = admin configured)
   - For each level, look up `referral_config` for that level
   - Calculate commission amount (% of subscription price or fixed)
   - Credit commission to upline user's wallet (same currency as subscription payment)
   - Create `commissions` record
   - Create `transactions` record (type: COMMISSION)
4. Admin can add/edit/remove referral levels at any time
5. If an upline user is banned, they do NOT receive commission

### Wallet Rules
1. Balance can never go below 0
2. Withdrawals go to PENDING status, admin must approve
3. When withdrawal is submitted, amount is moved to `locked_balance` so user can't spend it
4. On approval: locked_balance decremented, transaction recorded
5. On rejection: locked_balance returned to balance
6. Internal transfer is instant, no admin approval needed
7. Subscription payment checks balance > plan price before deducting

### Deposit Flow (NowPayments)
1. User selects crypto and clicks Deposit
2. API calls NowPayments to create payment → returns pay_address and pay_amount
3. Deposit record created in DB with status WAITING
4. User sends crypto to pay_address
5. NowPayments sends IPN webhook to `/api/webhooks/nowpayments`
6. Webhook verifies HMAC signature, updates deposit status
7. On FINISHED status: wallet balance credited, transaction recorded, notification sent

### Signal Access Control
- Free users (no subscription): see signals marked for free tier only (or delayed signals)
- Subscribed users: see signals matching their plan's `plan_required` field
- Admin: sees all signals regardless

---

## Zero Error Requirements

- TypeScript strict mode enabled (`"strict": true` in tsconfig.json)
- No `any` types — use proper types or `unknown`
- All API routes return typed responses
- All Prisma queries use generated types
- All forms validated with Zod before API calls
- All env vars validated at startup using a `validateEnv()` function
- ESLint with Next.js config — zero warnings in production build
- All async functions have proper error handling (try/catch)
- Webhook endpoint verifies HMAC signature before processing
- Admin routes check `role === ADMIN` server-side on every request
- User routes check active session server-side on every request
- Never trust client-side role claims

---

## Key npm Packages

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "@prisma/client": "latest",
    "zod": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "zustand": "latest",
    "recharts": "latest",
    "technicalindicators": "latest",
    "axios": "latest",
    "date-fns": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest",
    "sonner": "latest",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-table": "latest",
    "decimal.js": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "typescript": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "eslint": "latest",
    "eslint-config-next": "latest",
    "tailwindcss": "latest"
  }
}
```

**Note on `decimal.js`**: Always use Decimal for financial math. Never use JavaScript floats for money calculations — floating point errors will cause incorrect wallet balances.

---

## Scaffold Order (Follow This Exactly)

1. `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack`
2. Install all npm packages listed above
3. Initialize Prisma: `npx prisma init`
4. Write full `prisma/schema.prisma`
5. Set up `.env` with all variables
6. Run first migration: `npx prisma migrate dev --name init`
7. Generate Prisma client: `npx prisma generate`
8. Set up `src/lib/prisma.ts` singleton
9. Set up Supabase client/server helpers
10. Set up `src/middleware.ts` for route protection
11. Install and initialize shadcn/ui: `npx shadcn@latest init`
12. Build layouts (root, user, admin)
13. Build auth pages (login, register, forgot, reset)
14. Build user pages in order listed in BUILD_STATUS.md
15. Build admin pages in order listed in BUILD_STATUS.md
16. Build API routes
17. Build webhook handler
18. Build signal engine
19. Build referral commission engine
20. Final: run `npm run build` and fix all errors before considering done

---

## Vercel Deployment Notes

- Add all `.env` variables to Vercel project environment variables
- Prisma requires `postinstall` script: `"postinstall": "prisma generate"`
- Set `DIRECT_URL` for migrations (Prisma needs direct connection, not pooler, for migrations)
- Vercel functions have 10s timeout on free plan — keep API routes fast
- Run `npx prisma migrate deploy` (not dev) in production

---

## NowPayments IPN Security

The webhook at `/api/webhooks/nowpayments/route.ts` MUST:
1. Read raw request body (do not parse JSON first)
2. Compute HMAC-SHA512 of the raw body using `NOWPAYMENTS_IPN_SECRET`
3. Compare with `x-nowpayments-sig` header
4. Return 400 if signature mismatch — do not process
5. Be idempotent — check if deposit already processed before crediting wallet
