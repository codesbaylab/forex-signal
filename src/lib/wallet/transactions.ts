import { prisma } from '@/lib/prisma'
import { Currency, TransactionType, TransactionStatus } from '@prisma/client'
import Decimal from 'decimal.js'

type WalletTxOptions = {
  userId: string
  currency: Currency
  amount: Decimal | string | number
  type: TransactionType
  reference?: string
  note?: string
  metadata?: Record<string, unknown>
}

export async function creditWallet(options: WalletTxOptions) {
  const { userId, currency, amount, type, reference, note, metadata } = options
  const creditAmount = new Decimal(amount.toString())

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId, currency } } })
    if (!wallet) throw new Error(`Wallet not found for user ${userId} currency ${currency}`)

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: creditAmount.toFixed(8) as unknown as number } },
    })

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type,
        amount: creditAmount.toFixed(8) as unknown as number,
        currency,
        status: TransactionStatus.COMPLETED,
        reference,
        note,
        metadata: metadata ? (metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
      },
    })

    return { wallet: updated, transaction }
  })
}

export async function debitWallet(options: WalletTxOptions) {
  const { userId, currency, amount, type, reference, note, metadata } = options
  const debitAmount = new Decimal(amount.toString())

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId_currency: { userId, currency } } })
    if (!wallet) throw new Error(`Wallet not found`)

    const available = new Decimal(wallet.balance.toString()).minus(new Decimal(wallet.lockedBalance.toString()))
    if (available.lessThan(debitAmount)) {
      throw new Error(`Insufficient balance. Available: ${available.toFixed(8)} ${currency}`)
    }

    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: debitAmount.toFixed(8) as unknown as number } },
    })

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type,
        amount: debitAmount.toFixed(8) as unknown as number,
        currency,
        status: TransactionStatus.COMPLETED,
        reference,
        note,
        metadata: metadata ? (metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
      },
    })

    return { wallet: updated, transaction }
  })
}

export async function lockForWithdrawal(userId: string, currency: Currency, amount: Decimal) {
  const wallet = await prisma.wallet.findUnique({ where: { userId_currency: { userId, currency } } })
  if (!wallet) throw new Error('Wallet not found')

  const available = new Decimal(wallet.balance.toString()).minus(new Decimal(wallet.lockedBalance.toString()))
  if (available.lessThan(amount)) throw new Error('Insufficient balance')

  return prisma.wallet.update({
    where: { id: wallet.id },
    data: { lockedBalance: { increment: amount.toFixed(8) as unknown as number } },
  })
}

export async function unlockWithdrawal(userId: string, currency: Currency, amount: Decimal) {
  const wallet = await prisma.wallet.findUnique({ where: { userId_currency: { userId, currency } } })
  if (!wallet) throw new Error('Wallet not found')

  return prisma.wallet.update({
    where: { id: wallet.id },
    data: { lockedBalance: { decrement: amount.toFixed(8) as unknown as number } },
  })
}
