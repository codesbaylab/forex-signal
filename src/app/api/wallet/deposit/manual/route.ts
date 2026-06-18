import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Currency, TransactionType } from '@prisma/client'
import { verifyUsdtDeposit } from '@/lib/tron/verify'
import { creditWallet } from '@/lib/wallet/transactions'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { amount, txHash } = await request.json()
    if (!txHash?.trim()) return NextResponse.json({ success: false, error: 'Transaction hash is required' }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })

    const cleanHash = txHash.trim()

    // Duplicate hash check (global — prevents any user reusing a TX)
    const existing = await prisma.deposit.findFirst({ where: { txHash: cleanHash } })
    if (existing) return NextResponse.json({ success: false, error: 'This transaction hash has already been submitted.' }, { status: 409 })

    const wallet = await prisma.wallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: Currency.USDT_TRC20 } },
    })
    if (!wallet) return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })

    // Get admin deposit address from settings
    const addressSetting = await prisma.setting.findUnique({ where: { key: 'payment_manual_usdt_address' } })
    const adminAddress = addressSetting?.value ?? ''
    if (!adminAddress) {
      return NextResponse.json({ success: false, error: 'Deposit address not configured. Contact support.' }, { status: 503 })
    }

    // Verify on the TRON blockchain
    const verification = await verifyUsdtDeposit(cleanHash, adminAddress, Number(amount))

    if (!verification.ok) {
      // Retryable = TX not confirmed yet → save as WAITING, cron will re-check
      if (verification.retryable) {
        const deposit = await prisma.deposit.create({
          data: {
            userId: user.id,
            walletId: wallet.id,
            currency: Currency.USDT_TRC20,
            amount: amount as unknown as number,
            txHash: cleanHash,
            status: 'WAITING',
          },
        })
        return NextResponse.json({
          success: true,
          pending: true,
          message: 'Your deposit is submitted and will be credited once the transaction confirms on-chain (usually 1–3 minutes).',
          data: deposit,
        }, { status: 201 })
      }

      // Not retryable = wrong address, wrong token, too old, etc. → reject, don't save
      return NextResponse.json({ success: false, error: verification.error }, { status: 422 })
    }

    // Verification passed — auto-credit immediately
    const deposit = await prisma.deposit.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        currency: Currency.USDT_TRC20,
        amount: verification.actualAmount as unknown as number,
        txHash: cleanHash,
        status: 'FINISHED',
      },
    })

    await creditWallet({
      userId: user.id,
      currency: Currency.USDT_TRC20,
      amount: verification.actualAmount,
      type: TransactionType.DEPOSIT,
      reference: deposit.id,
      note: `Deposit verified — TX: ${cleanHash}`,
    })

    return NextResponse.json({
      success: true,
      auto: true,
      message: `Deposit verified! ${verification.actualAmount.toFixed(2)} USDT has been credited to your wallet.`,
      data: deposit,
    }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit deposit'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
