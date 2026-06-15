import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'

export default async function AdminSupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-700',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
    RESOLVED: 'bg-green-50 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-600',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-600',
  }

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={`${tickets.length} tickets total`} />
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Updated</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No tickets</td></tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{t.user.name}</p>
                    <p className="text-xs text-gray-400">{t.user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/support/${t.id}`} className="text-brand-700 hover:underline font-medium">{t.subject}</Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[t.status] ?? 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[t.priority] ?? 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
