import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { WhatsAppStubAdapter } from '@/lib/adapters/whatsapp/stub'

const openAccess = process.env.OPEN_ACCESS === 'true' || process.env.OPEN_ACCESS === '1'

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json()
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        approvals: true,
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Block execution if any approval is pending
    const hasPendingApproval = task.approvals.some(a => a.state === 'PENDING')
    if (hasPendingApproval) {
      return NextResponse.json({ error: 'Task awaiting approval' }, { status: 409 })
    }

    // Only allow low-risk tasks in this executor (medium/high should be handled by separate playbooks)
    if (task.riskLevel !== 'LOW') {
      return NextResponse.json({ error: 'Only LOW risk tasks can be executed here' }, { status: 400 })
    }

    // Execute supported actions
    switch (task.actionType) {
      case 'sendWhatsAppTemplate': {
        const { leadId, templateName, params } = task.payload || {}
        if (!leadId || !templateName) {
          return NextResponse.json({ error: 'Invalid payload for sendWhatsAppTemplate' }, { status: 400 })
        }
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          include: { contact: true }
        })
        if (!lead || !lead.contact?.phone) {
          return NextResponse.json({ error: 'Lead/contact not found or missing phone' }, { status: 404 })
        }
        const wa = new WhatsAppStubAdapter(process.env.NEXTAUTH_URL || 'http://localhost:3000')
        const res = await wa.sendTemplate({
          to: lead.contact.phone,
          templateName,
          templateParams: params || {},
        })
        await prisma.task.update({ where: { id: task.id }, data: { status: 'COMPLETED' } })
        await prisma.event.create({
          data: {
            name: 'task_executed',
            payload: { taskId: task.id, actionType: task.actionType, messageId: res.messageId }
          }
        })
        return NextResponse.json({ success: true, messageId: res.messageId })
      }
      case 'followUpDealPage': {
        const { leadId, linkCode } = task.payload || {}
        if (!leadId || !linkCode) {
          return NextResponse.json({ error: 'Invalid payload for followUpDealPage' }, { status: 400 })
        }
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          include: { contact: true }
        })
        if (!lead || !lead.contact?.phone) {
          return NextResponse.json({ error: 'Lead/contact not found or missing phone' }, { status: 404 })
        }
        const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/deal/${linkCode}`
        const wa = new WhatsAppStubAdapter(process.env.NEXTAUTH_URL || 'http://localhost:3000')
        const res = await wa.sendMessage(
          lead.contact.phone,
          `Hi! Your personalized deal is ready: ${url}`
        )
        await prisma.task.update({ where: { id: task.id }, data: { status: 'COMPLETED' } })
        await prisma.event.create({
          data: {
            name: 'task_executed',
            payload: { taskId: task.id, actionType: task.actionType, messageId: res.messageId }
          }
        })
        return NextResponse.json({ success: true, messageId: res.messageId })
      }
      default: {
        return NextResponse.json({ error: `Unsupported actionType ${task.actionType}` }, { status: 400 })
      }
    }
  } catch (error) {
    if (openAccess) {
      logger.error('Task execution failed (open access stub)', { error })
      return NextResponse.json({ success: true, stub: true })
    }
    logger.error('Task execution failed', { error })
    return NextResponse.json({ error: 'Task execution failed' }, { status: 500 })
  }
}
