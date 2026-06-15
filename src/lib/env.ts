function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  nowpayments: {
    apiKey: requireEnv('NOWPAYMENTS_API_KEY'),
    ipnSecret: requireEnv('NOWPAYMENTS_IPN_SECRET'),
    sandbox: process.env.NOWPAYMENTS_SANDBOX === 'true',
  },
  twelveData: {
    apiKey: requireEnv('TWELVE_DATA_API_KEY'),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    adminEmail: process.env.ADMIN_EMAIL ?? '',
  },
} as const
