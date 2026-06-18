import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import SignalsClient from './SignalsClient'

export default async function SignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const signals = await prisma.signal.findMany({
    where: { status: { in: ['ACTIVE', 'TP_HIT', 'SL_HIT', 'CLOSED'] } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const pricesSetting = await prisma.setting.findUnique({ where: { key: 'forex_prices' } })
  const prices: Record<string, { price: string; pct: string; dir: string }> =
    pricesSetting?.value ? JSON.parse(pricesSetting.value) : {}

  return (
    <div>
      <PageHeader
        title="Signals"
        subtitle="Live and historical forex trading signals"
        actions={
          <Link href="/signals/history">
            <Button variant="outline" className="text-sm">Signal History</Button>
          </Link>
        }
      />
      <SignalsClient signals={signals} prices={prices} />
    </div>
  )
}
