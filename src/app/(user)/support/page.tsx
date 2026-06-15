import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import NewTicketButton from './NewTicketButton'

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
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
      <PageHeader
        title="Support"
        subtitle="Get help from our team"
        actions={<NewTicketButton />}
      />

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {tickets.length === 0 && (
          <div className="p-12 text-center text-gray-400 text-sm">No tickets yet. Create one if you need help!</div>
        )}
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/support/${ticket.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">Updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[ticket.priority] ?? 'bg-gray-100 text-gray-500'}`}>
                {ticket.priority}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {ticket.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
