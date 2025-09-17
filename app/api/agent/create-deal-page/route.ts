import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { z } from 'zod'
// Auth bypass for development: remove next-auth dependency
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'

const createDealPageSchema = z.object({
  leadId: z.string(),
  unitIds: z.array(z.string()).min(1).max(3).optional(),
  expiryDays: z.number().min(1).max(30).default(7),
})

export async function POST(request: NextRequest) {
  const correlationId = crypto.randomUUID()

  try {
    // Bypass auth/role checks: grant open access in dev
    const role = 'OWNER'

    const body = await request.json()
    const { leadId, unitIds, expiryDays } = createDealPageSchema.parse(body)

    logger.info('Creating deal page', {
      correlationId,
      leadId,
      unitIds,
      expiryDays,
    })

    // Validate lead exists and is qualified/interested
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: true,
        project: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.status !== 'QUALIFIED' && lead.status !== 'INTERESTED') {
      return NextResponse.json(
        { error: 'Lead must be qualified or interested to create deal page' },
        { status: 400 }
      )
    }

    // Determine candidate units
    let selectedUnitIds: string[]
    if (unitIds && unitIds.length > 0) {
      // Validate the provided units (must be AVAILABLE and belong to the same project via tower)
      const units = await prisma.unit.findMany({
        where: {
          id: { in: unitIds },
          status: 'AVAILABLE',
          tower: {
            projectId: lead.projectId,
          },
        },
        include: { tower: true },
      })

      if (units.length !== unitIds.length) {
        return NextResponse.json(
          { error: 'Some units are not available or not found in the project' },
          { status: 400 }
        )
      }
      selectedUnitIds = units.map((u) => u.id)
    } else {
      // Auto-pick 3 available units from the lead's project
      const units = await prisma.unit.findMany({
        where: {
          status: 'AVAILABLE',
          tower: {
            projectId: lead.projectId,
          },
        },
        take: 3,
        include: { tower: true },
      })

      if (units.length === 0) {
        return NextResponse.json(
          { error: 'No available units found for this project' },
          { status: 400 }
        )
      }
      selectedUnitIds = units.map((u) => u.id)
    }

    // Generate unique link code
    const linkCode = `DEAL-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Create deal page with unit relations
    const dealPage = await prisma.dealPage.create({
      data: {
        leadId,
        linkCode,
        expiresAt,
        units: {
          connect: selectedUnitIds.map((id) => ({ id })),
        },
      },
    })

    // Update lead notes
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        notes: lead.notes
          ? `${lead.notes}\n\nDeal page created: ${linkCode}`
          : `Deal page created: ${linkCode}`,
      },
    })

    // Log event
    await prisma.event.create({
      data: {
        name: 'deal_page_created',
        payload: {
          linkCode,
          leadId,
          unitIds: selectedUnitIds,
          expiryDays,
          correlationId,
        },
      },
    })

    // Create low-risk follow-up task
    await prisma.task.create({
      data: {
        agentType: 'ConciergeAgent',
        actionType: 'followUpDealPage',
        payload: {
          leadId,
          linkCode,
          dueInHours: 24,
        },
        riskLevel: 'LOW',
        status: 'PENDING',
        reasonShort: `Follow up on deal page ${linkCode}`,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const dealUrl = `${baseUrl}/deal/${linkCode}`

    logger.info('Deal page created successfully', {
      correlationId,
      dealPageId: dealPage.id,
      linkCode,
      dealUrl,
    })

    return NextResponse.json({
      success: true,
      dealPage: {
        id: dealPage.id,
        linkCode,
        expiresAt: dealPage.expiresAt,
      },
      dealCode: linkCode,
      dealUrl,
    })
  } catch (error) {
    logger.error('Error creating deal page', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
