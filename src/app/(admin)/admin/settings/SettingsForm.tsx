'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  initialSettings: Record<string, string>
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-brand-700' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-6">
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function SettingsForm({ initialSettings: s }: Props) {
  // General
  const [siteName, setSiteName] = useState(s['site_name'] ?? 'SignalFX Pro')
  const [maintenance, setMaintenance] = useState(s['maintenance_mode'] === 'true')
  const [minUSDT, setMinUSDT] = useState(s['min_withdrawal_usdt'] ?? '10')
  const [trialDays, setTrialDays] = useState(s['trial_days'] ?? '7')

  // NowPayments
  const [npEnabled, setNpEnabled] = useState(s['payment_nowpayments_enabled'] === 'true')
  const [npApiKey, setNpApiKey] = useState(s['payment_nowpayments_api_key'] ?? '')
  const [npIpnSecret, setNpIpnSecret] = useState(s['payment_nowpayments_ipn_secret'] ?? '')
  const [npSandbox, setNpSandbox] = useState(s['payment_nowpayments_sandbox'] === 'true')

  // Billing
  const [annualDiscount, setAnnualDiscount] = useState(s['annual_discount_pct'] ?? '0')

  // Manual deposit
  const [manualEnabled, setManualEnabled] = useState(s['payment_manual_enabled'] === 'true')
  const [manualAddress, setManualAddress] = useState(s['payment_manual_usdt_address'] ?? '')
  const [manualNote, setManualNote] = useState(s['payment_manual_note'] ?? 'Send USDT (TRC20) to the address below and submit your transaction hash.')

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveSetting(key: string, value: string) {
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const days = parseInt(trialDays, 10)
    if (isNaN(days) || days < 1 || days > 365) {
      setError('Trial days must be between 1 and 365.')
      return
    }
    if (npEnabled && !npApiKey.trim()) {
      setError('NowPayments API Key is required when NowPayments is enabled.')
      return
    }
    if (npEnabled && !npIpnSecret.trim()) {
      setError('NowPayments IPN Secret is required when NowPayments is enabled.')
      return
    }
    if (manualEnabled && !manualAddress.trim()) {
      setError('USDT wallet address is required when Manual Deposit is enabled.')
      return
    }

    setLoading(true)
    const settings: Record<string, string> = {
      site_name: siteName,
      maintenance_mode: String(maintenance),
      min_withdrawal_usdt: minUSDT,
      trial_days: String(days),
      annual_discount_pct: annualDiscount,
      payment_nowpayments_enabled: String(npEnabled),
      payment_nowpayments_api_key: npApiKey,
      payment_nowpayments_ipn_secret: npIpnSecret,
      payment_nowpayments_sandbox: String(npSandbox),
      payment_manual_enabled: String(manualEnabled),
      payment_manual_usdt_address: manualAddress,
      payment_manual_note: manualNote,
    }

    for (const [key, value] of Object.entries(settings)) {
      await saveSetting(key, value)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 max-w-2xl">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-5 border border-red-100">{error}</div>}
      <form onSubmit={save} className="space-y-6">

        {/* General */}
        <div className="space-y-4">
          <p className="text-sm font-bold text-gray-900">General</p>
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-xs text-gray-400">Shows maintenance page to all users</p>
            </div>
            <Toggle enabled={maintenance} onChange={setMaintenance} />
          </div>
        </div>

        {/* Trial */}
        <Section title="Trial Period" subtitle="How long new users get free access after signup">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-xs text-gray-500">Trial Days</Label>
            <Input
              type="number"
              min="1"
              max="365"
              step="1"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              className="w-24"
            />
            <span className="text-xs text-gray-400">days of free access for new signups</span>
          </div>
          <p className="text-xs text-gray-400">
            Users also get a 7-day grace period after trial ends before commissions expire.
          </p>
        </Section>

        {/* Withdrawal */}
        <Section title="Withdrawal" subtitle="Minimum amounts users can withdraw">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-xs text-gray-500">Min USDT (TRC20)</Label>
            <Input type="number" min="0" step="0.01" value={minUSDT} onChange={(e) => setMinUSDT(e.target.value)} className="flex-1" />
          </div>
        </Section>

        {/* Billing */}
        <Section title="Billing" subtitle="Subscription pricing configuration">
          <div className="flex items-center gap-3">
            <Label className="w-32 text-xs text-gray-500">Annual Discount %</Label>
            <Input
              type="number"
              min="0"
              max="80"
              step="1"
              value={annualDiscount}
              onChange={(e) => setAnnualDiscount(e.target.value)}
              className="w-28"
            />
            <span className="text-xs text-gray-400">% off when billed annually (0 = no discount, billed at full monthly × 12)</span>
          </div>
        </Section>

        {/* NowPayments */}
        <Section title="NowPayments" subtitle="Automated crypto payment gateway">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable NowPayments</p>
              <p className="text-xs text-gray-400">Users get auto-generated payment address</p>
            </div>
            <Toggle enabled={npEnabled} onChange={setNpEnabled} />
          </div>

          {npEnabled && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <Label htmlFor="npApiKey">API Key <span className="text-red-500">*</span></Label>
                <Input
                  id="npApiKey"
                  type="password"
                  value={npApiKey}
                  onChange={(e) => setNpApiKey(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder="Your NowPayments API key"
                  required={npEnabled}
                />
                <p className="text-xs text-gray-400 mt-1">From NowPayments dashboard → API Keys</p>
              </div>
              <div>
                <Label htmlFor="npIpnSecret">IPN Secret <span className="text-red-500">*</span></Label>
                <Input
                  id="npIpnSecret"
                  type="password"
                  value={npIpnSecret}
                  onChange={(e) => setNpIpnSecret(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder="Your IPN secret key"
                  required={npEnabled}
                />
                <p className="text-xs text-gray-400 mt-1">From NowPayments dashboard → IPN Settings</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sandbox Mode</p>
                  <p className="text-xs text-gray-400">Use sandbox API for testing</p>
                </div>
                <Toggle enabled={npSandbox} onChange={setNpSandbox} />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">IPN Webhook URL</p>
                <p className="text-xs text-blue-600 font-mono mt-1 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://signalfxpro.vercel.app'}/api/webhooks/nowpayments
                </p>
                <p className="text-xs text-blue-500 mt-1">Add this URL in NowPayments → IPN Settings</p>
              </div>
            </div>
          )}
        </Section>

        {/* Manual Deposit */}
        <Section title="Manual Deposit" subtitle="Users send USDT directly to your wallet">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Enable Manual Deposit</p>
              <p className="text-xs text-gray-400">Users send to your address and submit TX hash</p>
            </div>
            <Toggle enabled={manualEnabled} onChange={setManualEnabled} />
          </div>

          {manualEnabled && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <Label htmlFor="manualAddress">Your USDT TRC20 Wallet Address <span className="text-red-500">*</span></Label>
                <Input
                  id="manualAddress"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder="T..."
                  required={manualEnabled}
                />
                <p className="text-xs text-gray-400 mt-1">This address is shown to users on the deposit page</p>
              </div>
              <div>
                <Label htmlFor="manualNote">Instruction Note</Label>
                <textarea
                  id="manualNote"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
                />
              </div>
            </div>
          )}
        </Section>

        {!npEnabled && !manualEnabled && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <p className="text-xs text-yellow-700 font-medium">No payment method enabled — users cannot deposit.</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
            {loading ? 'Saving…' : 'Save Settings'}
          </Button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ Saved successfully</span>}
        </div>
      </form>
    </div>
  )
}
