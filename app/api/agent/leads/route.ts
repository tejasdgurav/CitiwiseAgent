import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, projectId } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    // Ensure contact exists
    let contact = await prisma.contact.findUnique({ where: { phone } })
    if (!contact) {
      contact = await prisma.contact.create({ data: { phone, name: name || null, email: email || null } })
    } else if (name || email) {
      contact = await prisma.contact.update({ where: { id: contact.id }, data: { name: name || contact.name, email: email || contact.email } })
    }

    // Choose project: use provided or first available
    let pid = projectId as string | undefined
    if (!pid) {
      const proj = await prisma.project.findFirst()
      if (!proj) return NextResponse.json({ error: 'No project found. Create one on dashboard.' }, { status: 400 })
      pid = proj.id
    }

    // Create a NEW lead if there isn't an active one
    let lead = await prisma.lead.findFirst({
      where: {
        contactId: contact.id,
        projectId: pid,
        status: { in: ['NEW', 'QUALIFIED', 'INTERESTED'] },
      },
    })

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          contactId: contact.id,
          projectId: pid,
          source: 'PORTAL',
          status: 'NEW',
          notes: 'Created via Agent Console',
        },
      })
    }

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
