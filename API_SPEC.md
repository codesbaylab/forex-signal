# API Routes Specification

> All routes live under `src/app/api/`. All routes return JSON.
> Auth: every protected route checks Supabase session server-side.
> Admin routes additionally check `profile.role === 'ADMIN'`.

---

## Response Format (standard)

```ts
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code?: string }
```

---

## Auth Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/me` | User | Get current user profile |

---

## Signals

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/signals` | User | List signals (filtered by user's plan access). Query: `?status=ACTIVE&pair=EUR/USD&page=1&limit=20` |
| GET | `/api/signals/[id]` | User | Get single signal detail |
| POST | `/api/signals` | Admin | Create new signal |
| PUT | `/api/signals/[id]` | Admin | Update signal (edit or close) |
| DELETE | `/api/signals/[id]` | Admin | Delete signal (soft delete — set status to DRAFT) |

**POST /api/signals body:**
```ts
{
  pair: string            // "EUR/USD"
  direction: "BUY"|"SELL"
  entryPrice: number
  takeProfits: Array<{ level: number; price: number }>
  stopLoss: number
  timeframe: "M1"|"M5"|"M15"|"M30"|"H1"|"H4"|"D1"|"W1"
  analysis?: string
  chartUrl?: string
  planAccess: string[]    // plan ids, empty = all plans
  publishNow: boolean     // true = status ACTIVE, false = DRAFT
}
```

---

## Wallet

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/wallet` | User | Get all user wallets with balances |
| POST | `/api/wallet/deposit` | User | Create a NowPayments deposit request |
| POST | `/api/wallet/withdraw` | User | Submit withdrawal request |
| POST | `/api/wallet/transfer` | User | Internal transfer to another user |
| GET | `/api/wallet/transactions` | User | List transactions. Query: `?type=DEPOSIT&currency=USDT_TRC20&page=1` |

**POST /api/wallet/deposit body:**
```ts
{
  currency: "USDT_TRC20" | "BTC" | "BNB_BEP20"
  amount: number  // USD equivalent requested
}
```
**Response includes:** `payAddress`, `payAmount`, `payCurrency`, `depositId`

**POST /api/wallet/withdraw body:**
```ts
{
  currency: "USDT_TRC20" | "BTC" | "BNB_BEP20"
  amount: number
  toAddress: string
}
```
**Validation:** amount >= min_withdrawal setting, balance - lockedBalance >= amount

**POST /api/wallet/transfer body:**
```ts
{
  toUsername: string   // or toEmail
  currency: "USDT_TRC20" | "BTC" | "BNB_BEP20"
  amount: number
  note?: string
}
```

---

## Subscriptions

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/plans` | Public | List all active plans |
| GET | `/api/subscriptions/me` | User | Get user's current subscription |
| POST | `/api/subscriptions` | User | Subscribe to a plan (deducts from wallet) |
| DELETE | `/api/subscriptions/[id]` | User | Cancel subscription |

**POST /api/subscriptions body:**
```ts
{
  planId: string
  currency: "USDT_TRC20" | "BTC" | "BNB_BEP20"  // wallet to pay from
}
```
**Logic:**
1. Check user wallet balance >= plan price
2. Deduct from wallet → create SUBSCRIPTION_PAYMENT transaction
3. Create subscription record (status: ACTIVE)
4. Trigger commission distribution up referral chain
5. Send notification to user

---

## Referral

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/referral/stats` | User | Get referral stats: total referrals, active, total earned |
| GET | `/api/referral/tree` | User | Get downline tree by level (up to 4 levels) |
| GET | `/api/referral/commissions` | User | List commission transactions |

---

## Notifications

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | User | List user's notifications. Query: `?unread=true&page=1` |
| PUT | `/api/notifications/[id]/read` | User | Mark single notification as read |
| PUT | `/api/notifications/read-all` | User | Mark all as read |

---

## Support

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/support/tickets` | User | List user's tickets |
| POST | `/api/support/tickets` | User | Create new ticket |
| GET | `/api/support/tickets/[id]` | User | Get ticket with messages |
| POST | `/api/support/tickets/[id]/messages` | User | Reply to ticket |

---

## Announcements

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/announcements` | User | List published announcements |

---

## Admin — Users

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List all users. Query: `?search=&role=&banned=&page=1` |
| GET | `/api/admin/users/[id]` | Admin | Get user detail |
| PUT | `/api/admin/users/[id]` | Admin | Update user (ban/unban, role change) |
| PUT | `/api/admin/users/[id]/wallet` | Admin | Manual credit/debit user wallet |

---

## Admin — Withdrawals

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/withdrawals` | Admin | List withdrawals. Query: `?status=PENDING&page=1` |
| PUT | `/api/admin/withdrawals/[id]` | Admin | Approve or reject withdrawal |

**PUT /api/admin/withdrawals/[id] body:**
```ts
{
  action: "APPROVE" | "REJECT"
  note?: string
}
```

---

## Admin — Plans

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/plans` | Admin | Create plan |
| PUT | `/api/admin/plans/[id]` | Admin | Update plan |
| DELETE | `/api/admin/plans/[id]` | Admin | Deactivate plan |

---

## Admin — Referral Config

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/referral-config` | Admin | Get all level configs |
| PUT | `/api/admin/referral-config` | Admin | Update levels (upsert array) |

**PUT body:**
```ts
{
  levels: Array<{
    level: number
    commissionType: "PERCENTAGE" | "FIXED"
    commissionValue: number
    isActive: boolean
  }>
}
```

---

## Admin — Analytics

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/analytics/overview` | Admin | Total users, revenue, active subs, pending withdrawals |
| GET | `/api/admin/analytics/revenue` | Admin | Revenue over time. Query: `?period=30d|90d|1y` |
| GET | `/api/admin/analytics/signals` | Admin | Signal win rate, total signals, by pair breakdown |
| GET | `/api/admin/analytics/users` | Admin | User growth over time |

---

## Admin — Support

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/support/tickets` | Admin | All tickets. Query: `?status=OPEN&priority=HIGH` |
| PUT | `/api/admin/support/tickets/[id]` | Admin | Update ticket status/priority |
| POST | `/api/admin/support/tickets/[id]/messages` | Admin | Admin reply |

---

## Admin — Announcements

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/announcements` | Admin | List all (including drafts) |
| POST | `/api/admin/announcements` | Admin | Create announcement |
| PUT | `/api/admin/announcements/[id]` | Admin | Update / publish |
| DELETE | `/api/admin/announcements/[id]` | Admin | Delete |

---

## Admin — Notifications (Broadcast)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/admin/notifications` | Admin | Send notification to single user or all users |

**POST body:**
```ts
{
  userId?: string   // if null, broadcasts to all
  type: string
  title: string
  body: string
  actionUrl?: string
}
```

---

## Webhooks

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/webhooks/nowpayments` | HMAC | NowPayments IPN callback |

**HMAC Verification (MUST implement):**
```ts
import crypto from 'crypto'

function verifyNowPaymentsSignature(rawBody: string, signature: string): boolean {
  const hmac = crypto
    .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET!)
    .update(rawBody)
    .digest('hex')
  return hmac === signature
}
```

**IPN Handler logic:**
1. Read raw body as string (do NOT parse JSON before verifying)
2. Verify HMAC signature from `x-nowpayments-sig` header
3. Parse JSON
4. Find deposit by `nowpaymentsPaymentId`
5. Check if already FINISHED (idempotency) — if yes, return 200 early
6. Update deposit status
7. If status === 'finished': credit wallet balance, create DEPOSIT transaction, send notification
8. Return 200 OK

---

## Forex Data Route (internal)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/forex/price` | User | Get current price for a pair. Query: `?symbol=EUR/USD` |
| GET | `/api/forex/candles` | User | Get OHLC candles. Query: `?symbol=EUR/USD&interval=1h&outputsize=50` |
