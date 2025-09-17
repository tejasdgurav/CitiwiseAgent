import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TaskPlanner, PlannerContext } from '@/lib/tasks/planner'
import { logger } from '@/lib/logging'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIPlanner } from '@/lib/ai/planner'

const openAccess = process.env.OPEN_ACCESS === 'true' || process.env.OPEN_ACCESS === '1'

export async function POST(request: NextRequest) {
  try {
    if (!openAccess) {
      const session = await getServerSession(authOptions as any)
      const role = (session as any)?.role || (session as any)?.user?.role
      if (!session || !role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const allowed: string[] = ['OWNER', 'PROJECT_ADMIN', 'SALES_LEAD']
      if (!allowed.includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
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

    // Generate tasks (deterministic)
    const planner = new TaskPlanner()
    const deterministicTasks = await planner.generateTasks(context)

    // Propose additional tasks via AI (if enabled)
    const ai = new AIPlanner()
    const aiTasks = ai.isEnabled() ? await ai.proposeTasks(context) : []

    // Merge & de-duplicate by actionType + JSON payload string
    const seen = new Set<string>()
    const merged = [...deterministicTasks, ...aiTasks].filter((t) => {
      const key = `${t.actionType}:${JSON.stringify(t.payload)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Create tasks in database
    const createdTasks: string[] = []
    for (const taskInput of merged) {
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
    if (openAccess) {
      logger.error('Planning failed, returning stubbed plan (open access)', { error })
      // Stub fallback for dev/demo without DB/auth
      const now = Date.now()
      const days = 30
      const targetAmount = 5_00_00_000 // ₹5 Cr stub
      const currentCashFlow = 1_00_00_000 // ₹1 Cr stub
      const taskIds = Array.from({ length: 3 }).map((_, i) => `stub-task-${i + 1}`)
      return NextResponse.json({
        success: true,
        tasksGenerated: taskIds.length,
        taskIds,
        context: {
          currentCashFlow,
          targetAmount,
          cashGap: targetAmount - currentCashFlow,
          daysToTarget: Math.ceil((now + days * 86400000 - now) / 86400000),
        },
      })
    }
    logger.error('Planning failed', { error })
    return NextResponse.json(
      { error: 'Planning failed' },
      { status: 500 }
    )
  }
}
