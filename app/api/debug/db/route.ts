import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const project = await prisma.project.findFirst()
    const unitsCount = await prisma.unit.count()
    const leadsCount = await prisma.lead.count()
    return NextResponse.json({ ok: true, project: !!project, unitsCount, leadsCount })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
