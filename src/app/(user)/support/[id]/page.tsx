import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ReplyForm from './ReplyForm'

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const ticket = await prisma.supportTicket.findUnique({
    where: { id, userId: user.id },
    include: {
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
        <Link href="/support">
          <Button variant="ghost" className="text-gray-500 text-sm gap-2 pl-0"><ArrowLeft className="w-4 h-4" /> Back</Button>
        </Link>
      </div>
      <PageHeader title={ticket.subject} subtitle={`Ticket #${ticket.id.slice(0, 8)} · ${ticket.status}`} />

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {ticket.messages.map((msg) => {
            const isUser = msg.senderId === user.id
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  <p className={`text-xs font-semibold mb-1 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
                    {msg.sender.name} {msg.sender.role === 'ADMIN' && '(Support)'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isUser ? 'text-white/50' : 'text-gray-400'}`}>{new Date(msg.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
          {ticket.messages.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No messages yet</p>}
        </div>
      </div>

      {ticket.status !== 'CLOSED' && (
        <ReplyForm ticketId={ticket.id} />
      )}
    </div>
  )
}
