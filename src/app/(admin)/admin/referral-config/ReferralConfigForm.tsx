'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Level {
  level: number
  commissionType: string
  commissionValue: number
  isActive: boolean
}

export default function ReferralConfigForm({ initialLevels }: { initialLevels: Level[] }) {
  const router = useRouter()
  const [levels, setLevels] = useState<Level[]>(
    initialLevels.length > 0
      ? initialLevels
      : [{ level: 1, commissionType: 'PERCENTAGE', commissionValue: 10, isActive: true }]
  )
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateLevel(index: number, field: keyof Level, value: string | number | boolean) {
    setLevels((prev) => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  function addLevel() {
    setLevels((prev) => [...prev, { level: prev.length + 1, commissionType: 'PERCENTAGE', commissionValue: 5, isActive: true }])
  }

  function removeLevel(index: number) {
    setLevels((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, level: i + 1 })))
  }

  async function save() {
    setLoading(true)
    await fetch('/api/admin/referral-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levels }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="overflow-x-auto mb-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Level</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Active</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-4 py-3">
                  <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">L{level.level}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={level.commissionType}
                    onChange={(e) => updateLevel(i, 'commissionType', e.target.value)}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Input
                    type="number"
                    value={level.commissionValue}
                    onChange={(e) => updateLevel(i, 'commissionValue', Number(e.target.value))}
                    className="w-24 text-sm"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={level.isActive}
                    onChange={(e) => updateLevel(i, 'isActive', e.target.checked)}
                    className="w-4 h-4 accent-brand-700"
                  />
                </td>
                <td className="px-4 py-3">
                  {levels.length > 1 && (
                    <button onClick={() => removeLevel(i)} className="text-red-500 text-xs hover:underline">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={addLevel} variant="outline" className="text-sm">+ Add Level</Button>
        <Button onClick={save} disabled={loading} className="bg-brand-700 hover:bg-brand-800 text-white text-sm">
          {loading ? 'Saving…' : 'Save All'}
        </Button>
        {saved && <span className="text-green-600 text-sm">Saved!</span>}
      </div>
    </div>
  )
}
