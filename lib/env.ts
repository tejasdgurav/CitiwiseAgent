import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PAYMENTS_PROVIDER: z.enum(['stub']).or(z.string()).optional(),
  WHATSAPP_PROVIDER: z.enum(['stub']).or(z.string()).optional(),
  GA_MEASUREMENT_ID: z.string().optional(),
  DEMO_LOGIN_EMAIL: z.string().email().optional(),
  DEMO_LOGIN_PASSWORD: z.string().optional(),
})

export type Env = z.infer<typeof EnvSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached
  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    throw new Error(`Invalid environment variables: ${msg}`)
  }
  cached = parsed.data
  return cached
}
