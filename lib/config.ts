import { getEnv } from '@/lib/env'

const env = getEnv()

export const config = {
  database: {
    url: env.DATABASE_URL,
  },
  auth: {
    secret: env.NEXTAUTH_SECRET,
    url: env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },
  providers: {
    payments: env.PAYMENTS_PROVIDER || 'stub',
    whatsapp: env.WHATSAPP_PROVIDER || 'stub',
  },
  analytics: {
    gaId: env.GA_MEASUREMENT_ID,
  },
} as const
