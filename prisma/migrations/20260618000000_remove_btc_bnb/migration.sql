-- Migration: Remove BTC and BNB_BEP20 from Currency enum
-- Step 1: Clean up any lingering BTC/BNB records before altering the enum

DELETE FROM "transactions"
WHERE "currency" IN ('BTC', 'BNB_BEP20');

DELETE FROM "deposits"
WHERE "currency" IN ('BTC', 'BNB_BEP20');

DELETE FROM "withdrawals"
WHERE "currency" IN ('BTC', 'BNB_BEP20');

-- Commissions referencing removed transactions are cascade-safe; update currency just in case
UPDATE "commissions"
SET "currency" = 'USDT_TRC20'
WHERE "currency" IN ('BTC', 'BNB_BEP20');

-- Subscriptions paid in BTC/BNB — remap to USDT_TRC20
UPDATE "subscriptions"
SET "paidCurrency" = 'USDT_TRC20'
WHERE "paidCurrency" IN ('BTC', 'BNB_BEP20');

-- Plans with BTC/BNB currency — remap to USDT_TRC20
UPDATE "plans"
SET "currency" = 'USDT_TRC20'
WHERE "currency" IN ('BTC', 'BNB_BEP20');

-- Delete BTC/BNB wallets (transactions already removed above, so FK is clean)
DELETE FROM "wallets"
WHERE "currency" IN ('BTC', 'BNB_BEP20');

-- Step 2: Recreate the Currency enum with only USDT_TRC20
-- PostgreSQL does not support DROP VALUE, so we rename + recreate

ALTER TYPE "Currency" RENAME TO "Currency_old";

CREATE TYPE "Currency" AS ENUM ('USDT_TRC20');

-- Migrate every column that references Currency
ALTER TABLE "wallets"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

ALTER TABLE "transactions"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

ALTER TABLE "deposits"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

ALTER TABLE "withdrawals"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

ALTER TABLE "commissions"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

ALTER TABLE "subscriptions"
  ALTER COLUMN "paidCurrency" TYPE "Currency" USING "paidCurrency"::text::"Currency";

ALTER TABLE "plans"
  ALTER COLUMN "currency" TYPE "Currency" USING "currency"::text::"Currency";

DROP TYPE "Currency_old";

-- Step 3: Remove stale settings keys
DELETE FROM "settings"
WHERE "key" IN ('min_withdrawal_btc', 'min_withdrawal_bnb', 'supported_cryptos');

INSERT INTO "settings" ("id", "key", "value", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'supported_cryptos', 'USDT_TRC20', now(), now())
ON CONFLICT ("key") DO UPDATE SET "value" = 'USDT_TRC20', "updatedAt" = now();
