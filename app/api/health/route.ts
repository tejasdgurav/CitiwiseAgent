import { NextResponse } from 'next/server'

export async function GET() {
  // Simple health check endpoint for uptime monitoring
  return NextResponse.json({ ok: true, time: new Date().toISOString() })
}
