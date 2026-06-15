# Pre-Start Checklist

> Complete every item here BEFORE running any code.
> Tick each item as done. New sessions check this first.

---

## 1. Accounts to Create

| Service | Purpose | Status | URL |
|---|---|---|---|
| Supabase | Database + Auth | ⬜ | https://supabase.com |
| NowPayments | Crypto payment gateway | ⬜ | https://nowpayments.io |
| Twelve Data | Forex price data API | ⬜ | https://twelvedata.com |
| Vercel | Deployment | ⬜ | https://vercel.com |
| GitHub | Source control | ⬜ | https://github.com |

---

## 2. Supabase Setup Steps

1. ⬜ Create new Supabase project (choose region closest to your users)
2. ⬜ Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. ⬜ Go to **Project Settings → Database → Connection string**
   - Copy **Transaction pooler** URI (port 6543) → `DATABASE_URL`
   - Copy **Direct connection** URI (port 5432) → `DIRECT_URL`
   - Replace `[YOUR-PASSWORD]` in both with your actual DB password
4. ⬜ Go to **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: add `http://localhost:3000/auth/callback`
5. ⬜ Go to **Authentication → Providers → Email**:
   - Enable email provider ✓
   - Enable "Confirm email" ✓
6. ⬜ Go to **Authentication → Email Templates** — customize if desired
7. ⬜ **IMPORTANT**: Do NOT run any SQL migrations from Supabase dashboard. Prisma manages schema.

---

## 3. NowPayments Setup Steps

1. ⬜ Create account at https://nowpayments.io
2. ⬜ Go to **Store Settings** and create a new store for this project
3. ⬜ Copy **API Key** → `NOWPAYMENTS_API_KEY`
4. ⬜ Set **IPN Callback URL**: `https://yourdomain.com/api/webhooks/nowpayments`
   - For local dev use ngrok: `ngrok http 3000` then use the https URL
5. ⬜ Copy **IPN Secret Key** → `NOWPAYMENTS_IPN_SECRET`
6. ⬜ Enable currencies: USDT (TRC20), BTC, BNB (BEP20)
7. ⬜ Enable **Sandbox mode** for development (toggle in dashboard)
8. ⬜ Note: For sandbox, use https://sandbox.nowpayments.io

---

## 4. Twelve Data Setup Steps

1. ⬜ Create account at https://twelvedata.com
2. ⬜ Copy **API Key** from dashboard → `TWELVE_DATA_API_KEY`
3. ⬜ Free tier: 800 API calls/day, 8 calls/minute — enough for dev
4. ⬜ Currency pairs we'll use: EUR/USD, GBP/USD, USD/JPY, XAU/USD, AUD/USD, USD/CAD

---

## 5. Environment Variables

Create `.env` in project root — NEVER commit this file.

```env
# ─── Supabase ───────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...

# ─── Prisma ─────────────────────────────────────────────
# Transaction Pooler (port 6543) — used at runtime
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Direct Connection (port 5432) — used for migrations only
DIRECT_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

# ─── NowPayments ────────────────────────────────────────
NOWPAYMENTS_API_KEY=your-api-key
NOWPAYMENTS_IPN_SECRET=your-ipn-secret
NOWPAYMENTS_SANDBOX=true

# ─── Twelve Data ─────────────────────────────────────────
TWELVE_DATA_API_KEY=your-api-key

# ─── App ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=run: openssl rand -base64 32

# ─── Admin ───────────────────────────────────────────────
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 6. Local Tools Required

| Tool | Min Version | Check Command | Status |
|---|---|---|---|
| Node.js | 18.17+ | `node --version` | ⬜ |
| npm | 9+ | `npm --version` | ⬜ |
| Git | any | `git --version` | ⬜ |
| VS Code | any | — | ⬜ |

---

## 7. VS Code Extensions (Recommended)

- Prisma (prisma.prisma) — syntax highlighting for schema.prisma
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Error Lens
- GitLens

---

## 8. GitHub Setup

1. ⬜ Create new private repo: `forex-signal-platform`
2. ⬜ After project scaffold: `git init && git remote add origin <repo-url>`
3. ⬜ Make sure `.gitignore` includes: `.env`, `node_modules/`, `.next/`

---

## Status: ⬜ NOT READY — Complete all items before starting Phase 1
