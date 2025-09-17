import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { ApprovalState, TaskStatus } from '@prisma/client'

export interface ApprovalDecision {
  taskId: string
  approverId: string
  decision: 'APPROVED' | 'REJECTED'
  note?: string
}

export class ApprovalManager {
  async processApproval(decision: ApprovalDecision): Promise<void> {
    const { taskId, approverId, decision: state, note } = decision

    // Update approval record
    const approval = await prisma.approval.updateMany({
      where: {
        taskId,
        approverId,
        state: 'PENDING'
      },
      data: {
        state: state as ApprovalState,
        note,
        updatedAt: new Date()
      }
    })

    if (approval.count === 0) {
      throw new Error('Approval not found or already processed')
    }

    // Update task status based on approval
    let taskStatus: TaskStatus
    if (state === 'APPROVED') {
      taskStatus = 'PENDING' // Ready to be executed
    } else {
      taskStatus = 'CANCELLED'
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: taskStatus }
    })

    // Log the approval decision
    await prisma.auditLog.create({
      data: {
        userId: approverId,
        action: `task_${state.toLowerCase()}`,
        entityType: 'Task',
        entityId: taskId,
        payload: {
          decision: state,
          note,
          timestamp: new Date().toISOString()
        }
      }
    })

    logger.info('Approval processed', {
      taskId,
      approverId,
      decision: state,
      note
    })
  }

  async getPendingApprovals(approverId?: string): Promise<any[]> {
    const where: any = {
      state: 'PENDING'
    }

    if (approverId) {
      where.approverId = approverId
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            agentType: true,
            actionType: true,
            payload: true,
            riskLevel: true,
            cashImpactDelta: true,
            reasonShort: true,
            createdAt: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { task: { riskLevel: 'desc' } },
        { task: { cashImpactDelta: 'desc' } },
        { createdAt: 'asc' }
      ]
    })

    return approvals
  }

  async getApprovalHistory(taskId: string): Promise<any[]> {
    const approvals = await prisma.approval.findMany({
      where: { taskId },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return approvals
  }

  async simulateApprovalImpact(taskId: string): Promise<{
    cashImpact: number
    riskAssessment: string
    recommendations: string[]
  }> {
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      throw new Error('Task not found')
    }

    const cashImpact = task.cashImpactDelta || 0
    let riskAssessment = 'Low risk'
    const recommendations: string[] = []

    // Risk assessment logic
    if (task.riskLevel === 'HIGH') {
      riskAssessment = 'High risk - requires careful consideration'
      recommendations.push('Review with senior management')
      recommendations.push('Consider alternative approaches')
    } else if (task.riskLevel === 'MEDIUM') {
      riskAssessment = 'Medium risk - standard approval process'
      recommendations.push('Verify compliance with policies')
    }

    // Cash impact analysis
    if (Math.abs(cashImpact) > 5000000) { // 50L+
      recommendations.push('Significant cash impact - review financial projections')
    }

    if (task.actionType.includes('discount') || task.actionType.includes('offer')) {
      recommendations.push('Ensure discount is within approved budget limits')
    }

    return {
      cashImpact,
      riskAssessment,
      recommendations
    }
  }
}
