import { NextResponse } from 'next/server'

export async function GET() {
  const vars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'PAYMENTS_PROVIDER',
    'WHATSAPP_PROVIDER',
    'DEMO_LOGIN_EMAIL',
    'DEMO_LOGIN_PASSWORD',
  ] as const

  const presence: Record<string, boolean> = {}
  for (const k of vars) presence[k] = !!process.env[k]

  return NextResponse.json({ ok: true, presence })
}
