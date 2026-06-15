import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import AdminReplyForm from './AdminReplyForm'
import AdminTicketActions from './AdminTicketActions'

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const me = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!me || me.role !== 'ADMIN') redirect('/dashboard')

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      messages: {
        include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!ticket) notFound()

  return (
    <div>
      <div className="mb-5">
        <Link href="/admin/support"><Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Support</Button></Link>
      </div>
      <div className="flex items-start justify-between mb-5">
        <PageHeader title={ticket.subject} subtitle={`${ticket.user.name} · ${ticket.user.email}`} />
        <AdminTicketActions ticketId={ticket.id} status={ticket.status} priority={ticket.priority} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.map((msg) => {
            const isAdmin = msg.sender.role === 'ADMIN'
            return (
              <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className={`text-xs font-semibold mb-1 ${isAdmin ? 'text-white/70' : 'text-gray-500'}`}>
                    {msg.sender.name} {isAdmin && '(Support)'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-white/50' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
          {ticket.messages.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No messages</p>}
        </div>
      </div>

      {ticket.status !== 'CLOSED' && (
        <AdminReplyForm ticketId={ticket.id} />
      )}
    </div>
  )
}
