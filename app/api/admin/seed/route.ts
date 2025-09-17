import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole, UnitStatus, CashTargetStatus } from '@prisma/client'

export async function POST(_req: NextRequest) {
  try {
    // If already seeded (project exists), return ok
    const existingProject = await prisma.project.findFirst()
    if (existingProject) {
      return NextResponse.json({ ok: true, message: 'Already seeded', projectId: existingProject.id })
    }

    // Create org
    const org = await prisma.organization.create({ data: { name: 'Demo Org' } })

    // Create owner user (for RBAC, approvals, etc.)
    const owner = await prisma.user.create({
      data: {
        email: 'owner@citiwise.demo',
        name: 'Owner',
        role: UserRole.OWNER,
        organizationId: org.id,
      },
    })

    // Create project
    const project = await prisma.project.create({
      data: {
        name: 'CitiWise Heights',
        city: 'Mumbai',
        organizationId: org.id,
      },
    })

    // Create tower
    const tower = await prisma.tower.create({ data: { name: 'Tower A', projectId: project.id } })

    // Create few units
    const units = await prisma.$transaction([
      prisma.unit.create({ data: { towerId: tower.id, unitNumber: 'A-101', bhk: 2, carpetArea: 650, basePrice: 8000000, status: UnitStatus.AVAILABLE, plc: 300000, floorRise: 100000, parking: 1 } }),
      prisma.unit.create({ data: { towerId: tower.id, unitNumber: 'A-201', bhk: 2, carpetArea: 660, basePrice: 8200000, status: UnitStatus.AVAILABLE, plc: 320000, floorRise: 120000, parking: 1 } }),
      prisma.unit.create({ data: { towerId: tower.id, unitNumber: 'A-301', bhk: 3, carpetArea: 900, basePrice: 12500000, status: UnitStatus.AVAILABLE, plc: 500000, floorRise: 150000, parking: 2 } }),
    ])

    // Create active cash target
    const target = await prisma.cashTarget.create({
      data: {
        projectId: project.id,
        targetAmount: 50000000,
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: CashTargetStatus.ACTIVE,
      },
    })

    // Create a contact and lead
    const contact = await prisma.contact.create({ data: { phone: '+919999999999', name: 'Demo Lead', email: 'lead@demo.com' } })
    const lead = await prisma.lead.create({
      data: {
        contactId: contact.id,
        projectId: project.id,
        source: 'PORTAL',
        status: 'QUALIFIED',
        notes: 'Demo qualified lead',
      },
    })

    // Create a receipt for some cash flow
    await prisma.receipt.create({ data: { leadId: lead.id, amount: 1000000, paymentMethod: 'online', referenceId: 'seed-receipt-1' } })

    return NextResponse.json({ ok: true, projectId: project.id, unitIds: units.map(u => u.id), targetId: target.id, leadId: lead.id, ownerId: owner.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
