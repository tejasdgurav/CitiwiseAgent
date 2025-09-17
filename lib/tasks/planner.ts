import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { RiskLevel, TaskStatus } from '@prisma/client'

export interface TaskInput {
  agentType: string
  actionType: string
  payload: any
  riskLevel: RiskLevel
  cashImpactDelta?: number
  reasonShort?: string
}

export interface PlannerContext {
  projectId: string
  currentCashFlow: number
  targetAmount: number
  targetDate: Date
  activeTasks: number
  pendingApprovals: number
}

export class TaskPlanner {
  async generateTasks(context: PlannerContext): Promise<TaskInput[]> {
    const tasks: TaskInput[] = []
    
    logger.info('Generating tasks for project', { context })

    // Calculate cash gap
    const cashGap = context.targetAmount - context.currentCashFlow
    const daysToTarget = Math.ceil((context.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const dailyCashTarget = cashGap / Math.max(daysToTarget, 1)

    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: context.projectId },
      include: {
        leads: {
          where: {
            status: { in: ['NEW', 'QUALIFIED', 'INTERESTED'] }
          }
        },
        towers: {
          include: {
            units: {
              where: {
                status: 'AVAILABLE'
              }
            }
          }
        }
      }
    })

    if (!project) {
      logger.warn('Project not found for task generation', { projectId: context.projectId })
      return tasks
    }

    const availableUnits = project.towers.flatMap(tower => tower.units)
    const activeLeads = project.leads

    // 1. Release Units if inventory is low
    if (availableUnits.length < 5) {
      tasks.push({
        agentType: 'ReleaseAgent',
        actionType: 'releaseUnits',
        payload: {
          projectId: context.projectId,
          unitsToRelease: 10,
          reason: 'Low inventory - need more units for sales'
        },
        riskLevel: 'MEDIUM',
        cashImpactDelta: 0,
        reasonShort: 'Release more units for sales'
      })
    }

    // 2. Generate deal pages for qualified leads without active deals
    for (const lead of activeLeads.slice(0, 3)) {
      const existingDealPage = await prisma.dealPage.findFirst({
        where: {
          leadId: lead.id,
          expiresAt: { gt: new Date() }
        }
      })

      if (!existingDealPage && availableUnits.length >= 3) {
        const selectedUnits = availableUnits
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(unit => unit.id)

        tasks.push({
          agentType: 'DealAgent',
          actionType: 'generateDealPage',
          payload: {
            leadId: lead.id,
            unitIds: selectedUnits,
            expiryDays: 7
          },
          riskLevel: 'LOW',
          cashImpactDelta: 8500000, // Expected unit value
          reasonShort: 'Create deal page for qualified lead'
        })
      }
    }

    // 3. Send follow-up messages for stale leads
    const staleLeads = await prisma.lead.findMany({
      where: {
        projectId: context.projectId,
        status: 'QUALIFIED',
        updatedAt: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
      },
      take: 5
    })

    for (const lead of staleLeads) {
      tasks.push({
        agentType: 'ConciergeAgent',
        actionType: 'sendWhatsAppTemplate',
        payload: {
          leadId: lead.id,
          templateName: 'follow_up_reminder',
          params: {
            customer_name: 'Valued Customer',
            project_name: project.name
          }
        },
        riskLevel: 'LOW',
        cashImpactDelta: 0,
        reasonShort: 'Follow up with stale lead'
      })
    }

    // 4. Create payment reminders for pending tokens
    const pendingTokens = await prisma.token.findMany({
      where: {
        status: 'CREATED',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        }
      },
      include: {
        dealPage: {
          include: {
            lead: {
              include: {
                contact: true
              }
            }
          }
        }
      },
      take: 5
    })

    for (const token of pendingTokens) {
      tasks.push({
        agentType: 'PaymentsAgent',
        actionType: 'sendWhatsAppTemplate',
        payload: {
          leadId: token.dealPage.leadId,
          templateName: 'payment_reminder',
          params: {
            customer_name: token.dealPage.lead.contact.name || 'Valued Customer',
            amount: `₹${(token.amount / 100000).toFixed(0)} L`,
            due_date: 'within 24 hours'
          }
        },
        riskLevel: 'LOW',
        cashImpactDelta: token.amount,
        reasonShort: 'Remind customer about pending token payment'
      })
    }

    // 5. High-impact tasks based on cash gap
    if (cashGap > 50000000 && daysToTarget < 30) { // 5 Cr gap with less than 30 days
      tasks.push({
        agentType: 'DealAgent',
        actionType: 'createOffer',
        payload: {
          projectId: context.projectId,
          discountPercent: 5,
          validityDays: 7,
          reason: 'Urgent cash target - limited time discount'
        },
        riskLevel: 'HIGH',
        cashImpactDelta: -2500000, // Discount impact
        reasonShort: 'Urgent discount to meet cash target'
      })
    }

    logger.info('Generated tasks', { 
      projectId: context.projectId, 
      taskCount: tasks.length,
      cashGap,
      daysToTarget 
    })

    return tasks
  }

  async createTask(taskInput: TaskInput): Promise<string> {
    const task = await prisma.task.create({
      data: {
        agentType: taskInput.agentType,
        actionType: taskInput.actionType,
        payload: taskInput.payload,
        riskLevel: taskInput.riskLevel,
        cashImpactDelta: taskInput.cashImpactDelta,
        reasonShort: taskInput.reasonShort,
        status: taskInput.riskLevel === 'LOW' ? 'PENDING' : 'PENDING', // All tasks start as pending
      }
    })

    // Create approval if medium or high risk
    if (taskInput.riskLevel === 'MEDIUM' || taskInput.riskLevel === 'HIGH') {
      // Find an appropriate approver (for now, get any OWNER or PROJECT_ADMIN)
      const approver = await prisma.user.findFirst({
        where: {
          role: { in: ['OWNER', 'PROJECT_ADMIN'] }
        }
      })

      if (approver) {
        await prisma.approval.create({
          data: {
            taskId: task.id,
            approverId: approver.id,
            state: 'PENDING'
          }
        })
      }
    }

    logger.info('Task created', { 
      taskId: task.id, 
      agentType: taskInput.agentType, 
      actionType: taskInput.actionType,
      riskLevel: taskInput.riskLevel 
    })

    return task.id
  }

  async getTodayTasks(projectId?: string): Promise<any[]> {
    const where: any = {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      },
      status: { in: ['PENDING', 'IN_PROGRESS'] }
    }

    if (projectId) {
      // Filter by project if specified (would need to add projectId to Task model)
      // For now, we'll get all tasks
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { riskLevel: 'desc' },
        { cashImpactDelta: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return tasks
  }
}
