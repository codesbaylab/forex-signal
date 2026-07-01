export type AccessInfo = {
  hasAccess: boolean
  inTrial: boolean
  isPaid: boolean
  trialExpired: boolean
  inGrace: boolean
  daysLeft: number
  graceEnd: Date | null
  trialEndsAt: Date | null
}

export function getUserAccess(
  profile: { trialEndsAt: Date | null },
  activeSub: { status: string } | null
): AccessInfo {
  const now = new Date()
  const trialEndsAt = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null
  const inTrial = trialEndsAt !== null && trialEndsAt > now
  const isPaid = activeSub?.status === 'ACTIVE'
  const trialExpired = trialEndsAt !== null && trialEndsAt <= now
  const graceEnd = trialEndsAt ? new Date(trialEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null
  const inGrace = trialExpired && !isPaid && graceEnd !== null && graceEnd > now
  // Grandfathered: users who existed before trial system (no trialEndsAt set)
  const grandfathered = trialEndsAt === null && !isPaid
  const hasAccess = inTrial || isPaid || grandfathered
  const daysLeft = inTrial && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return { hasAccess, inTrial, isPaid, trialExpired, inGrace, daysLeft, graceEnd, trialEndsAt }
}
