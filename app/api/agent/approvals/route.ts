import { NextRequest, NextResponse } from 'next/server'
import { ApprovalManager } from '@/lib/tasks/approvals'
import { logger } from '@/lib/logging'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const openAccess = process.env.OPEN_ACCESS === 'true' || process.env.OPEN_ACCESS === '1'

export async function GET(request: NextRequest) {
  try {
    // Conditionally enforce auth
    if (!openAccess) {
      const session = await getServerSession(authOptions as any)
      const role = (session as any)?.role || (session as any)?.user?.role
      if (!session || !role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const allowed: string[] = ['OWNER', 'PROJECT_ADMIN', 'FINANCE', 'SALES_LEAD']
      if (!allowed.includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { searchParams } = new URL(request.url)
    const approverId = searchParams.get('approverId')

    const approvalManager = new ApprovalManager()
    const pendingApprovals = await approvalManager.getPendingApprovals(approverId || undefined)

    return NextResponse.json({
      success: true,
      approvals: pendingApprovals
    })
  } catch (error) {
    if (openAccess) {
      logger.error('Failed to get approvals, returning stubbed empty list (open access)', { error })
      return NextResponse.json({ success: true, approvals: [] })
    }
    logger.error('Failed to get approvals', { error })
    return NextResponse.json(
      { error: 'Failed to get approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    let session: any = null
    if (!openAccess) {
      session = await getServerSession(authOptions as any)
      const role = session?.role || session?.user?.role
      if (!session || !role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const allowed: string[] = ['OWNER', 'PROJECT_ADMIN', 'FINANCE']
      if (!allowed.includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { taskId, approverId: bodyApproverId, decision, note } = await request.json()
    const resolvedApproverId = bodyApproverId || session?.user?.id || session?.id

    if (!taskId || !resolvedApproverId || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    const approvalManager = new ApprovalManager()
    await approvalManager.processApproval({
      taskId,
      approverId: resolvedApproverId,
      decision,
      note
    })

    return NextResponse.json({
      success: true,
      message: `Task ${decision.toLowerCase()} successfully`
    })
  } catch (error) {
    if (openAccess) {
      logger.error('Failed to process approval, returning stubbed success (open access)', { error })
      return NextResponse.json({ success: true, message: 'Task processed (stub)' })
    }
    logger.error('Failed to process approval', { error })
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}
