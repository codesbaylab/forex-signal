import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'

export default async function AdminWalletsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const wallets = await prisma.wallet.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  })

  return (
    <div>
      <PageHeader title="Wallets" subtitle="All user wallets" />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Currency</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Balance</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Locked</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{w.user.name}</p>
                    <p className="text-xs text-gray-400">{w.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-gray-700">{w.currency}</td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{Number(w.balance).toFixed(8)}</td>
                  <td className="px-5 py-3 text-orange-500">{Number(w.lockedBalance).toFixed(8)}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(w.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
