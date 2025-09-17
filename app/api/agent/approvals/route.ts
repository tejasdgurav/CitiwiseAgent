import { NextRequest, NextResponse } from 'next/server'
import { ApprovalManager } from '@/lib/tasks/approvals'
import { logger } from '@/lib/logging'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const approverId = searchParams.get('approverId')

    const approvalManager = new ApprovalManager()
    const pendingApprovals = await approvalManager.getPendingApprovals(approverId || undefined)

    return NextResponse.json({
      success: true,
      approvals: pendingApprovals
    })
  } catch (error) {
    logger.error('Failed to get approvals', { error })
    return NextResponse.json(
      { error: 'Failed to get approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, approverId, decision, note } = await request.json()

    if (!taskId || !approverId || !decision) {
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
      approverId,
      decision,
      note
    })

    return NextResponse.json({
      success: true,
      message: `Task ${decision.toLowerCase()} successfully`
    })
  } catch (error) {
    logger.error('Failed to process approval', { error })
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}
