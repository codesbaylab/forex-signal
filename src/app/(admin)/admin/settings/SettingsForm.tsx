'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  initialSettings: Record<string, string>
}

export default function SettingsForm({ initialSettings }: Props) {
  const [siteName, setSiteName] = useState(initialSettings['site_name'] ?? 'ForexSignal')
  const [maintenance, setMaintenance] = useState(initialSettings['maintenance_mode'] === 'true')
  const [minUSDT, setMinUSDT] = useState(initialSettings['min_withdrawal_usdt'] ?? '10')
  const [minBTC, setMinBTC] = useState(initialSettings['min_withdrawal_btc'] ?? '0.001')
  const [minBNB, setMinBNB] = useState(initialSettings['min_withdrawal_bnb'] ?? '0.05')
  const [referralLevels, setReferralLevels] = useState(initialSettings['referral_levels_count'] ?? '3')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const settings = [
      { key: 'site_name', value: siteName },
      { key: 'maintenance_mode', value: String(maintenance) },
      { key: 'min_withdrawal_usdt', value: minUSDT },
      { key: 'min_withdrawal_btc', value: minBTC },
      { key: 'min_withdrawal_bnb', value: minBNB },
      { key: 'referral_levels_count', value: referralLevels },
    ]

    for (const s of settings) {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 max-w-lg">
      <form onSubmit={save} className="space-y-5">
        <div>
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="maintenance" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} className="w-4 h-4 accent-brand-700" />
          <Label htmlFor="maintenance">Maintenance Mode (shows maintenance page to users)</Label>
        </div>
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">Minimum Withdrawal Amounts</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="w-28 text-xs text-gray-500">USDT TRC20</Label>
              <Input type="number" value={minUSDT} onChange={(e) => setMinUSDT(e.target.value)} className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-xs text-gray-500">Bitcoin</Label>
              <Input type="number" step="0.00001" value={minBTC} onChange={(e) => setMinBTC(e.target.value)} className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="w-28 text-xs text-gray-500">BNB BEP20</Label>
              <Input type="number" step="0.001" value={minBNB} onChange={(e) => setMinBNB(e.target.value)} className="flex-1" />
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="referralLevels">Referral Levels Count</Label>
          <Input id="referralLevels" type="number" min="1" max="10" value={referralLevels} onChange={(e) => setReferralLevels(e.target.value)} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white">
            {loading ? 'Saving…' : 'Save Settings'}
          </Button>
          {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
        </div>
      </form>
    </div>
  )
}
