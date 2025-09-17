import { PrismaClient, UserRole, LeadSource, LeadStatus, UnitStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // If already seeded (a project exists), exit early to make seeding idempotent
  const existing = await prisma.project.findFirst()
  if (existing) {
    console.log('Seed skipped: project already exists (idempotent).')
    return
  }
  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'CitiWise Demo Corp',
    },
  })

  // Create owner user
  const owner = await prisma.user.create({
    data: {
      email: 'owner@citiwise.com',
      name: 'Demo Owner',
      role: UserRole.OWNER,
      organizationId: org.id,
    },
  })

  // Create project
  const project = await prisma.project.create({
    data: {
      name: 'Skyline Residences',
      city: 'Mumbai',
      organizationId: org.id,
      policies: {
        discountBudget: 500000,
        maxHoldDays: 7,
        tokenAmount: 100000,
      },
      bankPartners: ['HDFC', 'ICICI', 'SBI'],
    },
  })

  // Create tower
  const tower = await prisma.tower.create({
    data: {
      name: 'Tower A',
      projectId: project.id,
    },
  })

  // Create sample units
  const units = await Promise.all([
    prisma.unit.create({
      data: {
        towerId: tower.id,
        unitNumber: 'A101',
        bhk: 2,
        carpetArea: 650,
        usage: 'Residential',
        status: UnitStatus.AVAILABLE,
        basePrice: 8500000,
        plc: 150000,
        floorRise: 0,
        vastu: 'East',
        parking: 1,
      },
    }),
    prisma.unit.create({
      data: {
        towerId: tower.id,
        unitNumber: 'A201',
        bhk: 2,
        carpetArea: 650,
        usage: 'Residential',
        status: UnitStatus.AVAILABLE,
        basePrice: 8650000,
        plc: 150000,
        floorRise: 50000,
        vastu: 'East',
        parking: 1,
      },
    }),
    prisma.unit.create({
      data: {
        towerId: tower.id,
        unitNumber: 'A301',
        bhk: 3,
        carpetArea: 950,
        usage: 'Residential',
        status: UnitStatus.AVAILABLE,
        basePrice: 12500000,
        plc: 200000,
        floorRise: 100000,
        vastu: 'North',
        parking: 2,
      },
    }),
  ])

  // Create sample contact and lead
  const contact = await prisma.contact.create({
    data: {
      phone: '+919876543210',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
    },
  })

  const lead = await prisma.lead.create({
    data: {
      contactId: contact.id,
      projectId: project.id,
      source: LeadSource.WHATSAPP,
      status: LeadStatus.QUALIFIED,
      notes: 'Interested in 2-3 BHK units',
    },
  })

  // Create cash target
  await prisma.cashTarget.create({
    data: {
      projectId: project.id,
      targetAmount: 120000000, // 12 cr
      targetDate: new Date('2024-03-31'),
    },
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
