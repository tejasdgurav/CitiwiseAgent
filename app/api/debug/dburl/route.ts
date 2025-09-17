import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL || ''
  try {
    // Basic parse without leaking password
    const m = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)(.*)?$/)
    if (!m) {
      return NextResponse.json({ ok: false, message: 'Could not parse DATABASE_URL', urlPresent: !!url })
    }
    const [, user, _password, host, port, database] = m
    const masked = {
      user,
      host,
      port,
      database,
      // For safety, do not include password or query params
    }
    return NextResponse.json({ ok: true, masked })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
