# Build Status

> Read this at the start of every session. Update it as you complete tasks.
> Never start coding without checking CHECKLIST.md first.

---

## Current Status: ✅ BUILD PASSES — AWAITING ENV VARS & DATABASE MIGRATION

Last updated: 2026-06-15

`npm run build` completes with **zero TypeScript errors, zero lint warnings**. All 75 routes compiled. The Prisma connection errors during static generation are expected — they disappear once DATABASE_URL is set.

---

## Planning Documents (All Ready)

| Document | Purpose | Status |
|---|---|---|
| [PROJECT.md](PROJECT.md) | Master project overview, tech stack, business rules, scaffold order | ✅ Ready |
| [CHECKLIST.md](CHECKLIST.md) | Accounts, API keys, env vars — complete before coding | ✅ Ready |
| [SCHEMA.md](SCHEMA.md) | Full Prisma schema + seed data — copy-paste ready | ✅ Ready |
| [DESIGN.md](DESIGN.md) | Color palette, typography, components, shadcn list | ✅ Ready |
| [API_SPEC.md](API_SPEC.md) | All API routes, request/response types, business logic | ✅ Ready |
| [COMPONENTS.md](COMPONENTS.md) | Every component, hook, and lib file planned | ✅ Ready |
| [BUILD_STATUS.md](BUILD_STATUS.md) | This file — progress tracker | ✅ Ready |

---

## Pre-Start Checklist

| Item | Status |
|---|---|
| Supabase project created + keys collected | ⬜ |
| NowPayments account + API key + IPN secret | ⬜ |
| Twelve Data API key | ⬜ |
| Vercel account | ⬜ |
| GitHub repo created | ⬜ |
| Node.js 18.17+ installed | ✅ |
| .env file ready with all values | ⬜ (copy .env.example → .env and fill in values) |

**Do NOT run `prisma migrate dev` until DATABASE_URL and DIRECT_URL are set.**

---

## Phase 1 — Project Scaffold
| Task | Status | Notes |
|---|---|---|
| `npx create-next-app@latest` | ✅ | Next.js 14, TypeScript, Tailwind, App Router |
| Install all npm packages | ✅ | All dependencies installed |
| `npx prisma init` | ✅ | |
| Copy schema → `prisma/schema.prisma` | ✅ | 15 models, 16 enums |
| Create `.env.example` | ✅ | All keys documented |
| `npx prisma migrate dev --name init` | ⬜ | **Needs DIRECT_URL set first** |
| `npx prisma generate` | ✅ | Client generated |
| Run seed: `npx prisma db seed` | ⬜ | **Needs live DB first** |
| `npx shadcn@latest init` | ✅ | |
| Install all shadcn components | ✅ | |
| Update `globals.css` with green palette | ✅ | brand-700 = #1a6b3c |
| Verify `npm run build` zero errors | ✅ | **PASSING** |

### Phase 1 Status: ✅ CODE COMPLETE — DB migration pending env vars

---

## Phase 2 — Core Setup
| Task | Status | Notes |
|---|---|---|
| `src/lib/prisma.ts` singleton | ✅ | |
| `src/lib/supabase/client.ts` | ✅ | Browser client |
| `src/lib/supabase/server.ts` | ✅ | Server + API routes |
| `src/middleware.ts` — route protection | ✅ | Protects all routes, checks ADMIN role |
| `src/types/index.ts` — shared TS types | ✅ | |
| `src/app/layout.tsx` — root layout | ✅ | Inter font, Sonner toaster |
| `src/app/error.tsx` | ✅ | |
| `src/app/not-found.tsx` | ✅ | |
| `src/app/maintenance/page.tsx` | ✅ | |

### Phase 2 Status: ✅ COMPLETE

---

## Phase 3 — Layouts & Shared Components
| Task | Status | Notes |
|---|---|---|
| `UserSidebar.tsx` | ✅ | |
| `AdminSidebar.tsx` | ✅ | |
| `Topbar.tsx` | ✅ | |
| `PageHeader.tsx` | ✅ | |
| `StatCard.tsx` | ✅ | |
| `DataTable.tsx` | ✅ | |
| `EmptyState.tsx` | ✅ | |
| `CryptoIcon.tsx` | ✅ | |
| `LiveDot.tsx` | ✅ | |
| `MarketSession.tsx` | ✅ | |
| `ConfirmDialog.tsx` | ✅ | |
| `CopyButton.tsx` | ✅ | Named export (not default) |
| `(user)/layout.tsx` | ✅ | |
| `(admin)/layout.tsx` | ✅ | |

### Phase 3 Status: ✅ COMPLETE

---

## Phase 4 — Auth Pages
| Task | Status | Notes |
|---|---|---|
| `app/page.tsx` — Landing | ✅ | |
| `auth/login/page.tsx` | ✅ | |
| `auth/register/page.tsx` | ✅ | Auto-fills ref code from `?ref=` param |
| `auth/forgot-password/page.tsx` | ✅ | |
| `auth/reset-password/page.tsx` | ✅ | |
| `auth/callback/route.ts` | ✅ | Supabase PKCE callback |
| `api/auth/create-profile` | ✅ | Creates Profile + 3 wallets on signup |

### Phase 4 Status: ✅ COMPLETE

---

## Phase 5 — User Pages (21 pages)
| Task | Status | Notes |
|---|---|---|
| `/dashboard` | ✅ | |
| `/signals` | ✅ | |
| `/signals/[id]` | ✅ | |
| `/signals/history` | ✅ | |
| `/wallet` | ✅ | |
| `/wallet/deposit` | ✅ | NowPayments integration |
| `/wallet/withdraw` | ✅ | |
| `/wallet/transfer` | ✅ | |
| `/transactions` | ✅ | |
| `/subscription` | ✅ | |
| `/referral` | ✅ | |
| `/commissions` | ✅ | |
| `/profile` | ✅ | |
| `/notifications` | ✅ | |
| `/support` | ✅ | |
| `/support/[id]` | ✅ | |
| `/announcements` | ✅ | |

### Phase 5 Status: ✅ COMPLETE

---

## Phase 6 — Admin Pages (19 pages)
| Task | Status | Notes |
|---|---|---|
| `/admin` (dashboard) | ✅ | |
| `/admin/users` | ✅ | |
| `/admin/users/[id]` | ✅ | |
| `/admin/signals` | ✅ | |
| `/admin/signals/new` | ✅ | |
| `/admin/signals/[id]/edit` | ✅ | |
| `/admin/plans` | ✅ | |
| `/admin/plans/new` | ✅ | |
| `/admin/plans/[id]/edit` | ✅ | |
| `/admin/subscriptions` | ✅ | |
| `/admin/deposits` | ✅ | |
| `/admin/withdrawals` | ✅ | |
| `/admin/transactions` | ✅ | |
| `/admin/referral-config` | ✅ | |
| `/admin/commissions` | ✅ | |
| `/admin/wallets` | ✅ | |
| `/admin/settings` | ✅ | |
| `/admin/notifications` | ✅ | |
| `/admin/analytics` | ✅ | |
| `/admin/support` | ✅ | |
| `/admin/support/[id]` | ✅ | |
| `/admin/announcements` | ✅ | |
| `/admin/announcements/new` | ✅ | |
| `/admin/announcements/[id]/edit` | ✅ | |

### Phase 6 Status: ✅ COMPLETE

---

## Phase 7 — API Routes
| Task | Status | Notes |
|---|---|---|
| `GET/PATCH /api/auth/me` | ✅ | |
| `GET/POST /api/signals` | ✅ | |
| `GET /api/signals/[id]` | ✅ | |
| `GET /api/wallet` | ✅ | |
| `POST /api/wallet/deposit` | ✅ | |
| `POST /api/wallet/withdraw` | ✅ | |
| `POST /api/wallet/transfer` | ✅ | |
| `GET /api/wallet/transactions` | ✅ | |
| `GET /api/plans` | ✅ | |
| `GET /api/subscriptions/me` | ✅ | |
| `POST /api/subscriptions` | ✅ | Triggers commission distribution |
| `GET /api/referral/stats` | ✅ | |
| `GET /api/referral/tree` | ✅ | |
| `GET /api/referral/commissions` | ✅ | |
| `GET /api/notifications` | ✅ | |
| `PATCH /api/notifications/[id]/read` | ✅ | |
| `POST /api/notifications/read-all` | ✅ | |
| `GET/POST /api/support/tickets` | ✅ | |
| `GET /api/support/tickets/[id]` | ✅ | |
| `POST /api/support/tickets/[id]/messages` | ✅ | field: `message` |
| `GET /api/announcements` | ✅ | |
| `GET/PUT /api/admin/users` | ✅ | |
| `GET /api/admin/users/[id]` | ✅ | |
| `PUT /api/admin/users/[id]/wallet` | ✅ | |
| `GET/PUT /api/admin/withdrawals` | ✅ | |
| `PUT /api/admin/withdrawals/[id]` | ✅ | field: `adminNote` |
| `GET/POST/PUT/DELETE /api/admin/plans/[id]` | ✅ | |
| `GET/PUT /api/admin/referral-config` | ✅ | |
| `GET /api/admin/analytics/overview` | ✅ | |
| `GET /api/admin/analytics/revenue` | ✅ | startedAt null-safe |
| `GET/PUT /api/admin/support/tickets` | ✅ | |
| `PUT /api/admin/support/tickets/[id]` | ✅ | |
| `POST /api/admin/support/tickets/[id]/messages` | ✅ | field: `message` |
| `GET/POST /api/admin/announcements` | ✅ | requires `createdBy` |
| `PUT/DELETE /api/admin/announcements/[id]` | ✅ | |
| `POST /api/admin/notifications` | ✅ | |
| `GET /api/admin/settings` | ✅ | |
| `GET /api/forex/price` | ✅ | |
| `GET /api/forex/candles` | ✅ | |
| `POST /api/webhooks/nowpayments` | ✅ | HMAC-SHA512 verified |

### Phase 7 Status: ✅ COMPLETE

---

## Phase 8 — Core Logic Libraries
| Task | Status | Notes |
|---|---|---|
| `src/lib/nowpayments/client.ts` | ✅ | |
| `src/lib/nowpayments/webhook.ts` | ✅ | HMAC-SHA512 verifier |
| `src/lib/forex/twelvedata.ts` | ✅ | |
| `src/lib/signals/engine.ts` | ✅ | RSI, MACD, EMA, Bollinger |
| `src/lib/referral/commission.ts` | ✅ | Unilevel, walks referredById chain |
| `src/lib/wallet/transactions.ts` | ✅ | Atomic credit/debit with Decimal.js |
| `src/lib/validations/auth.ts` | ✅ | |
| `src/lib/validations/signal.ts` | ✅ | |
| `src/lib/validations/wallet.ts` | ✅ | |
| `src/lib/validations/admin.ts` | ✅ | |
| `prisma/seed.ts` | ✅ | Plans, referral levels, settings |

### Phase 8 Status: ✅ COMPLETE

---

## Phase 9 — Deploy to Vercel (no local run)

> **This project deploys live to Vercel only. No local dev server needed.**
> `vercel.json` sets the build command to `prisma migrate deploy && next build` — migrations run automatically on every deploy.

### Step-by-step deploy order:

#### 1. Create GitHub repo & push code
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### 2. Create Supabase project
- Go to supabase.com → New project
- Copy: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Connection string (Transaction pooler port 6543) → `DATABASE_URL`
- Connection string (Direct port 5432) → `DIRECT_URL`
- In Supabase Auth settings → set Site URL to your Vercel URL

#### 3. Import repo to Vercel
- vercel.com → New Project → Import from GitHub
- Framework: Next.js (auto-detected)
- Build command: auto from `vercel.json` (`prisma migrate deploy && next build`)

#### 4. Add ALL env vars in Vercel dashboard (Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL           ← Supabase Transaction Pooler (port 6543) + ?pgbouncer=true&connection_limit=1
DIRECT_URL             ← Supabase Direct connection (port 5432)
NOWPAYMENTS_API_KEY
NOWPAYMENTS_IPN_SECRET
TWELVE_DATA_API_KEY
NEXT_PUBLIC_APP_URL    ← https://your-project.vercel.app
```

#### 5. Deploy
- Click Deploy in Vercel — it runs `npm install` → `prisma generate` (postinstall) → `prisma migrate deploy` → `next build`
- First deploy creates all database tables automatically

#### 6. Seed the database (one time only)
After first deploy, run seed from your local machine (only needs DIRECT_URL):
```
# Create a temporary .env.local with just DATABASE_URL pointing to direct connection
DATABASE_URL="postgresql://..." npx prisma db seed
```
Or use Supabase SQL editor to insert seed data manually.

#### 7. Create your admin account
- Register on the live site normally
- In Supabase → Table Editor → profiles → find your row → set `role` to `ADMIN`

#### 8. Set NowPayments IPN URL
- NowPayments dashboard → IPN settings → `https://your-project.vercel.app/api/webhooks/nowpayments`

#### 9. Set Supabase Auth redirect URLs
- Supabase → Auth → URL Configuration → add `https://your-project.vercel.app/auth/callback`

---

| Task | Status |
|---|---|
| `npm run build` passes zero errors | ✅ |
| `vercel.json` created (auto-migrates on deploy) | ✅ |
| `.env` excluded from git | ✅ |
| Push to GitHub | ⬜ |
| Create Supabase project + collect keys | ⬜ |
| Add env vars in Vercel dashboard | ⬜ |
| First Vercel deploy (creates tables) | ⬜ |
| Seed database (one time) | ⬜ |
| Set self as ADMIN in Supabase | ⬜ |
| Set NowPayments IPN URL | ⬜ |
| Set Supabase redirect URL | ⬜ |
| Smoke test: register, deposit, subscribe | ⬜ |

### Phase 9 Status: ⬜ READY TO DEPLOY

---

## Critical Field Name Notes (Bugs Fixed)

These were wrong in generated code — fixed to match Prisma schema:

| Wrong | Correct | Model |
|---|---|---|
| `msg.body` | `msg.message` | `TicketMessage` |
| `d.priceAmount` | `d.amount` | `Deposit` |
| `orderId` | `nowpaymentsOrderId` | `Deposit` |
| `paymentId` | `nowpaymentsPaymentId` | `Deposit` |
| `note` | `adminNote` | `Withdrawal` |
| `createdById` | `createdBy` | `Signal`, `Announcement` |
| `status: 'PENDING'` | `status: 'WAITING'` | `Deposit` (DepositStatus enum) |
| `TransactionType.SUBSCRIPTION` | `TransactionType.SUBSCRIPTION_PAYMENT` | enum value |
| `ticket.status !== 'RESOLVED'` | `ticket.status !== 'CLOSED'` | TicketStatus enum has no RESOLVED |

---

## Status Key
- ⬜ TODO
- 🔄 IN PROGRESS
- ✅ DONE
- ❌ BLOCKED — add note explaining why

---

## Session Log

### 2026-06-15 — Session 1
- Defined full project scope, tech stack, 40 pages (21 user + 19 admin)
- Built `dashboard-preview.html` — approved by user as design reference
- Created all 6 planning documents (PROJECT, CHECKLIST, SCHEMA, DESIGN, API_SPEC, COMPONENTS)

### 2026-06-15 — Session 2
- Scaffolded entire codebase: all pages, API routes, components, lib files
- Fixed all TypeScript/ESLint build errors across 20+ files
- `npm run build` passes with zero errors — 75 routes compiled
- **Next step: fill .env → prisma migrate dev → prisma db seed → npm run dev**
