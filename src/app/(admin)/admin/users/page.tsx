import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true }, take: 1 },
    },
  })

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} total users`} />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Plan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {u.subscriptions[0] ? (
                      <span className="bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded-full">{u.subscriptions[0].plan.name}</span>
                    ) : <span className="text-gray-400">Free</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isBanned ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-brand-700 font-semibold hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
