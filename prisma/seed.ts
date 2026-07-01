import { PrismaClient, CommissionType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Default settings
  const settings = [
    { key: 'maintenance_mode', value: 'false' },
    { key: 'site_name', value: 'SignalFX Pro' },
    { key: 'min_withdrawal_usdt', value: '10' },
    { key: 'supported_cryptos', value: 'USDT_TRC20' },
    { key: 'trial_days', value: '7' },
    { key: 'annual_discount_pct', value: '0' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  // Commission levels — 7-level unilevel, 100% pool
  const levels = [
    { level: 1, commissionType: CommissionType.PERCENTAGE, commissionValue: 35 },
    { level: 2, commissionType: CommissionType.PERCENTAGE, commissionValue: 20 },
    { level: 3, commissionType: CommissionType.PERCENTAGE, commissionValue: 15 },
    { level: 4, commissionType: CommissionType.PERCENTAGE, commissionValue: 12 },
    { level: 5, commissionType: CommissionType.PERCENTAGE, commissionValue: 8 },
    { level: 6, commissionType: CommissionType.PERCENTAGE, commissionValue: 6 },
    { level: 7, commissionType: CommissionType.PERCENTAGE, commissionValue: 4 },
  ]

  for (const l of levels) {
    await prisma.referralConfig.upsert({
      where: { level: l.level },
      update: { commissionValue: l.commissionValue, commissionType: l.commissionType, isActive: true },
      create: l,
    })
  }

  // Plans — Pro only (annual billing at $4/month = $48/year)
  const proExisting = await prisma.plan.findFirst({ where: { name: 'Pro' } })
  if (!proExisting) {
    await prisma.plan.create({
      data: {
        name: 'Pro',
        description: 'Full access to all signals, real-time alerts, and the referral program',
        price: 4, // $4/month base; shown as "$4/mo, billed $48/year"
        durationDays: 30,
        features: JSON.stringify([
          'Real-time XAU/USD signals',
          'H1 + H4 ICT sweep strategy',
          'Entry, SL, and TP levels',
          'Market analysis on every signal',
          'Referral program — earn from 7 levels',
          'Priority support',
        ]),
        signalAccess: JSON.stringify(['pro']),
        isActive: true,
        sortOrder: 0,
      },
    })
  } else {
    // Update price to $4
    await prisma.plan.update({
      where: { id: proExisting.id },
      data: { price: 4, durationDays: 30 },
    })
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
