import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TaskPlanner, PlannerContext } from '@/lib/tasks/planner'
import { logger } from '@/lib/logging'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const role = (session as any)?.role || (session as any)?.user?.role
    if (!session || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const allowed: string[] = ['OWNER', 'PROJECT_ADMIN', 'SALES_LEAD']
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get current cash target and calculate context
    const cashTarget = await prisma.cashTarget.findFirst({
      where: {
        projectId,
        status: 'ACTIVE'
      }
    })

    if (!cashTarget) {
      return NextResponse.json(
        { error: 'No active cash target found for project' },
        { status: 404 }
      )
    }

    // Calculate current cash flow (sum of receipts)
    const receipts = await prisma.receipt.aggregate({
      where: {
        lead: {
          projectId
        }
      },
      _sum: {
        amount: true
      }
    })

    const currentCashFlow = receipts._sum.amount || 0

    // Get active tasks and pending approvals count
    const [activeTasks, pendingApprovals] = await Promise.all([
      prisma.task.count({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      }),
      prisma.approval.count({
        where: {
          state: 'PENDING'
        }
      })
    ])

    const context: PlannerContext = {
      projectId,
      currentCashFlow,
      targetAmount: cashTarget.targetAmount,
      targetDate: cashTarget.targetDate,
      activeTasks,
      pendingApprovals
    }

    // Generate tasks
    const planner = new TaskPlanner()
    const taskInputs = await planner.generateTasks(context)

    // Create tasks in database
    const createdTasks = []
    for (const taskInput of taskInputs) {
      const taskId = await planner.createTask(taskInput)
      createdTasks.push(taskId)
    }

    logger.info('Planning completed', {
      projectId,
      tasksGenerated: createdTasks.length,
      context
    })

    return NextResponse.json({
      success: true,
      tasksGenerated: createdTasks.length,
      taskIds: createdTasks,
      context: {
        currentCashFlow,
        targetAmount: cashTarget.targetAmount,
        cashGap: cashTarget.targetAmount - currentCashFlow,
        daysToTarget: Math.ceil((cashTarget.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    })
  } catch (error) {
    logger.error('Planning failed', { error })
    return NextResponse.json(
      { error: 'Planning failed' },
      { status: 500 }
    )
  }
}
