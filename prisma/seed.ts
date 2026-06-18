import { PrismaClient, CommissionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Default settings
  const settings = [
    { key: 'maintenance_mode', value: 'false' },
    { key: 'site_name', value: 'ForexSignal' },
    { key: 'min_withdrawal_usdt', value: '10' },
    { key: 'referral_levels_count', value: '4' },
    { key: 'supported_cryptos', value: 'USDT_TRC20' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  // Default referral levels
  const levels = [
    { level: 1, commissionType: CommissionType.PERCENTAGE, commissionValue: 10 },
    { level: 2, commissionType: CommissionType.PERCENTAGE, commissionValue: 5 },
    { level: 3, commissionType: CommissionType.PERCENTAGE, commissionValue: 3 },
    { level: 4, commissionType: CommissionType.PERCENTAGE, commissionValue: 2 },
  ]

  for (const l of levels) {
    await prisma.referralConfig.upsert({
      where: { level: l.level },
      update: {},
      create: l,
    })
  }

  // Default plans
  const plans = [
    {
      name: 'Free',
      description: 'Limited signals with 1 hour delay',
      price: 0,
      durationDays: 36500,
      features: JSON.stringify(['Up to 3 signals/day', '1 hour delay', 'Major pairs only']),
      signalAccess: JSON.stringify(['free']),
      sortOrder: 0,
    },
    {
      name: 'Basic',
      description: 'Real-time signals on major pairs',
      price: 29,
      durationDays: 30,
      features: JSON.stringify(['Unlimited signals', 'Real-time alerts', 'Major pairs', 'Signal history']),
      signalAccess: JSON.stringify(['free', 'basic']),
      sortOrder: 1,
    },
    {
      name: 'Pro',
      description: 'All pairs including Gold and indices',
      price: 59,
      durationDays: 30,
      features: JSON.stringify(['Everything in Basic', 'Gold & indices', 'VIP analysis', 'Priority support']),
      signalAccess: JSON.stringify(['free', 'basic', 'pro']),
      sortOrder: 2,
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } })
    if (!existing) {
      await prisma.plan.create({ data: plan })
    }
  }

  console.log('✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
