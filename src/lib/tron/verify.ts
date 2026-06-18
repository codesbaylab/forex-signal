const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
const TRONSCAN_API = 'https://apilist.tronscanapi.com'
const MAX_TX_AGE_HOURS = 72
const MIN_CONFIRMATIONS = 19

export type VerifyResult =
  | { ok: true; actualAmount: number; txTimestamp: number }
  | { ok: false; error: string; retryable: boolean }

export async function verifyUsdtDeposit(
  txHash: string,
  expectedToAddress: string,
  expectedAmount: number,
): Promise<VerifyResult> {
  try {
    const res = await fetch(
      `${TRONSCAN_API}/api/transaction-info?hash=${encodeURIComponent(txHash)}`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' },
    )

    if (!res.ok) {
      return { ok: false, error: 'Could not reach blockchain explorer. Try again shortly.', retryable: true }
    }

    const data = await res.json()

    // TX not found
    if (!data.hash) {
      return { ok: false, error: 'Transaction not found on TRON blockchain. Double-check your TX hash.', retryable: false }
    }

    // Not confirmed yet — valid reason to retry later
    if (!data.confirmed) {
      return { ok: false, error: 'Transaction is not yet confirmed. Please wait a moment.', retryable: true }
    }

    // Not enough confirmations
    const confirmations = data.confirmations ?? data.block_confirmations ?? MIN_CONFIRMATIONS
    if (confirmations < MIN_CONFIRMATIONS) {
      return { ok: false, error: `Waiting for confirmations (${confirmations}/${MIN_CONFIRMATIONS}).`, retryable: true }
    }

    // TX too old
    const ageHours = (Date.now() - data.timestamp) / 3_600_000
    if (ageHours > MAX_TX_AGE_HOURS) {
      return {
        ok: false,
        error: `Transaction is ${Math.floor(ageHours)} hours old. Only transactions within 72 hours are accepted.`,
        retryable: false,
      }
    }

    // TX itself failed
    if (data.contractRet && data.contractRet !== 'SUCCESS') {
      return { ok: false, error: 'Transaction failed on the blockchain.', retryable: false }
    }

    // Must have TRC20 transfer info
    const transfers: Array<{
      contract_address: string
      to_address: string
      amount_str: string
      decimals: number
    }> = data.trc20TransferInfo ?? []

    if (transfers.length === 0) {
      return {
        ok: false,
        error: 'No token transfer found. Send USDT (TRC20), not TRX or another token.',
        retryable: false,
      }
    }

    // Find a USDT transfer to our address
    const usdtTransfer = transfers.find(
      (t) =>
        t.contract_address === USDT_CONTRACT &&
        t.to_address?.toLowerCase() === expectedToAddress.toLowerCase(),
    )

    if (!usdtTransfer) {
      const anyUsdt = transfers.find((t) => t.contract_address === USDT_CONTRACT)
      if (anyUsdt) {
        return { ok: false, error: 'USDT sent to the wrong address. Send to the address shown on the deposit page.', retryable: false }
      }
      return { ok: false, error: 'No USDT (TRC20) transfer found. Make sure you sent USDT, not another token.', retryable: false }
    }

    // Verify amount (USDT TRC20 has 6 decimals)
    const decimals = usdtTransfer.decimals ?? 6
    const actualAmount = Number(usdtTransfer.amount_str) / Math.pow(10, decimals)

    if (actualAmount < expectedAmount - 0.01) {
      return {
        ok: false,
        error: `Amount mismatch: ${actualAmount.toFixed(2)} USDT received, ${expectedAmount.toFixed(2)} USDT expected.`,
        retryable: false,
      }
    }

    return { ok: true, actualAmount, txTimestamp: data.timestamp }
  } catch {
    return { ok: false, error: 'Blockchain verification error. Try again.', retryable: true }
  }
}
