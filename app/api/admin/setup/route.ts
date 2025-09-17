import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      organizationName = 'Citiwise Org',
      ownerEmail,
      ownerName,
      projectName,
      city,
      targetAmount,
      targetDate,
      units = [], // [{ tower: 'A', unitNumber: '101', bhk: 2, carpetArea: 750, basePrice: 6500000, plc, floorRise, parking }]
    } = body || {}

    if (!ownerEmail || !projectName || !city || !targetAmount || !targetDate) {
      return NextResponse.json({ error: 'ownerEmail, projectName, city, targetAmount, targetDate are required' }, { status: 400 })
    }

    // Create or get org
    let org = await prisma.organization.findFirst({ where: { name: organizationName } })
    if (!org) {
      org = await prisma.organization.create({ data: { name: organizationName } })
    }

    // Create or get owner user (passwordless for now; NextAuth credentials flow uses env to restrict, but we store user for role)
    let user = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase() } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: ownerEmail.toLowerCase(),
          name: ownerName || ownerEmail,
          role: UserRole.OWNER,
          organizationId: org.id,
        }
      })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: projectName,
        city,
        organizationId: org.id,
      }
    })

    // Cash target
    await prisma.cashTarget.create({
      data: {
        projectId: project.id,
        targetAmount: Number(targetAmount),
        targetDate: new Date(targetDate),
      }
    })

    // Create a single tower and seed units
    const tower = await prisma.tower.create({ data: { name: 'Tower A', projectId: project.id } })

    if (Array.isArray(units) && units.length > 0) {
      await prisma.unit.createMany({
        data: units.map((u: any, idx: number) => ({
          towerId: tower.id,
          unitNumber: String(u.unitNumber || 100 + idx),
          bhk: Number(u.bhk || 2),
          carpetArea: Number(u.carpetArea || 750),
          basePrice: Number(u.basePrice || 6500000),
          plc: u.plc != null ? Number(u.plc) : null,
          floorRise: u.floorRise != null ? Number(u.floorRise) : null,
          parking: u.parking != null ? Number(u.parking) : null,
        }))
      })
    } else {
      // Minimal sample inventory to get going
      await prisma.unit.createMany({
        data: [
          { towerId: tower.id, unitNumber: '101', bhk: 2, carpetArea: 750, basePrice: 6500000, parking: 1 },
          { towerId: tower.id, unitNumber: '102', bhk: 2, carpetArea: 760, basePrice: 6600000, parking: 1 },
          { towerId: tower.id, unitNumber: '201', bhk: 3, carpetArea: 980, basePrice: 8200000, parking: 2 },
          { towerId: tower.id, unitNumber: '202', bhk: 3, carpetArea: 990, basePrice: 8300000, parking: 2 },
          { towerId: tower.id, unitNumber: '301', bhk: 1, carpetArea: 520, basePrice: 4200000, parking: 1 },
        ]
      })
    }

    return NextResponse.json({ success: true, organizationId: org.id, projectId: project.id, ownerUserId: user.id })
  } catch (error) {
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}
