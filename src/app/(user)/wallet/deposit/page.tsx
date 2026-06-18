'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DepositSchema, type DepositInput } from '@/lib/validations/wallet'
import { Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type Step = 'form' | 'nowpayments' | 'manual' | 'submitted'

type NowPaymentsData = { pay_address: string; pay_amount: number; pay_currency: string; payment_id: string }
type ManualData = { address: string; amount: number; note: string }

export default function DepositPage() {
  const [step, setStep] = useState<Step>('form')
  const [npData, setNpData] = useState<NowPaymentsData | null>(null)
  const [manualData, setManualData] = useState<ManualData | null>(null)
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ auto: boolean; message: string } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<DepositInput>({
    resolver: zodResolver(DepositSchema),
    defaultValues: { currency: 'USDT_TRC20' },
  })

  async function onSubmit(data: DepositInput) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (json.method === 'nowpayments') {
        setNpData(json.data)
        setStep('nowpayments')
      } else {
        setManualData({ ...json.data, amount: data.amount })
        setStep('manual')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create deposit')
    } finally {
      setLoading(false)
    }
  }

  async function submitTxHash() {
    if (!txHash.trim() || !manualData) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/wallet/deposit/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: manualData.amount, txHash }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSubmitResult({ auto: json.auto === true, message: json.message })
      setStep('submitted')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setStep('form')
    setNpData(null)
    setManualData(null)
    setTxHash('')
    setError(null)
    setSubmitResult(null)
  }

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Deposit" subtitle="Add funds to your wallet" />

      {/* Step 1 — Amount form */}
      {step === 'form' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Currency</Label>
              <div className="mt-2 flex items-center gap-3 bg-brand-50 border-2 border-brand-700 rounded-xl px-4 py-3">
                <span className="text-xl">₮</span>
                <span className="text-sm font-semibold text-brand-700">USDT (TRC20)</span>
              </div>
              <input type="hidden" value="USDT_TRC20" {...register('currency')} />
            </div>
            <div>
              <Label htmlFor="amount">Amount (USDT)</Label>
              <Input id="amount" type="number" step="0.01" min="1" className="mt-1" {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Processing…' : 'Continue to Payment'}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2a — NowPayments */}
      {step === 'nowpayments' && npData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 text-2xl">₮</div>
            <h2 className="font-bold text-gray-900 text-lg">Send Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Send the exact amount to the address below</p>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Payment Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-gray-900 break-all flex-1">{npData.pay_address}</p>
                <button onClick={() => copy(npData.pay_address)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Amount to Send</p>
              <p className="font-bold text-gray-900 text-lg">{npData.pay_amount} {npData.pay_currency?.toUpperCase()}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-xs text-yellow-700 font-medium">⚠️ Important</p>
              <p className="text-xs text-yellow-600 mt-1">Send only the exact amount shown. Your wallet will be credited automatically after network confirmation.</p>
            </div>
          </div>
          <Button onClick={reset} variant="outline" className="w-full mt-6">Make another deposit</Button>
        </div>
      )}

      {/* Step 2b — Manual deposit */}
      {step === 'manual' && manualData && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-3 text-2xl">₮</div>
            <h2 className="font-bold text-gray-900 text-lg">Send USDT</h2>
            <p className="text-sm text-gray-500 mt-1">{manualData.note}</p>
          </div>
          <div className="space-y-3 mb-5">
            {/* QR Code */}
            <div className="flex flex-col items-center bg-white border-2 border-dashed border-brand-200 rounded-xl p-5">
              <QRCodeSVG
                value={manualData.address}
                size={180}
                level="M"
                includeMargin={false}
                className="rounded-lg"
              />
              <p className="text-xs text-gray-400 mt-3">Scan with your wallet app</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Send to Address (TRC20)</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-gray-900 break-all flex-1">{manualData.address}</p>
                <button onClick={() => copy(manualData.address)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-xs text-brand-600 mb-1">Amount to Send</p>
              <p className="font-bold text-brand-700 text-xl">{manualData.amount} USDT</p>
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4 border border-red-100">{error}</div>}
          <div className="space-y-3">
            <div>
              <Label htmlFor="txHash">Transaction Hash (TX ID)</Label>
              <Input
                id="txHash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="mt-1 font-mono text-sm"
                placeholder="Paste your TRONScan transaction hash"
              />
              <p className="text-xs text-gray-400 mt-1">After sending, paste the TX hash from your wallet or TRONScan</p>
            </div>
            <Button onClick={submitTxHash} disabled={loading || !txHash.trim()} className="w-full bg-brand-700 hover:bg-brand-800 text-white">
              {loading ? 'Submitting…' : 'Submit Deposit'}
            </Button>
          </div>
          <Button onClick={reset} variant="ghost" className="w-full mt-2 text-gray-400">Cancel</Button>
        </div>
      )}

      {/* Step 3 — Submitted */}
      {step === 'submitted' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-7 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${submitResult?.auto ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <Check className={`w-7 h-7 ${submitResult?.auto ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-2">
            {submitResult?.auto ? 'Deposit Credited!' : 'Deposit Submitted'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {submitResult?.message ?? 'Your deposit is being verified and will be credited shortly.'}
          </p>
          <Button onClick={reset} variant="outline">Make another deposit</Button>
        </div>
      )}
    </div>
  )
}
