import { prisma } from '@/lib/db'
import { CashCurve } from '@/components/dashboard/CashCurve'
import { TodayQueue } from '@/components/dashboard/TodayQueue'
import { ApprovalsInbox } from '@/components/dashboard/ApprovalsInbox'
import { RiskPanel } from '@/components/dashboard/RiskPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RunPlannerButton } from '@/components/common/RunPlannerButton'
import { Plus, Target, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  let project: any = null
  try {
    // Get the first project for demo (in production, this would be user-specific)
    project = await prisma.project.findFirst({
      include: {
        cashTargets: {
          where: { status: 'ACTIVE' },
          orderBy: { targetDate: 'asc' },
          take: 1
        }
      }
    })
  } catch (e) {
    // swallow and render setup screen
  }
  // Fallback to stub project in dev/no-DB mode so dashboard keeps working without login/DB
  let isStub = false
  if (!project) {
    isStub = true
    project = {
      id: 'stub-project',
      name: 'Demo Project',
      city: 'Mumbai',
      cashTargets: [
        {
          targetAmount: 5_00_00_000, // ₹5 Cr
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    }
  }

  const cashTarget = project.cashTargets[0]

  // Calculate current cash flow
  let receipts: any = { _sum: { amount: 0 } }
  try {
    receipts = await prisma.receipt.aggregate({
      where: {
        lead: {
          projectId: project.id
        }
      },
      _sum: {
        amount: true
      }
    })
  } catch {}

  const currentCashFlow = receipts._sum.amount || 0

  // Get today's tasks
  let todayTasks: any[] = []
  try {
    todayTasks = await prisma.task.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { riskLevel: 'desc' },
        { createdAt: 'asc' }
      ],
      take: 10
    })
  } catch {}

  // Get pending approvals
  let pendingApprovals: any[] = []
  try {
    pendingApprovals = await prisma.approval.findMany({
      where: {
        state: 'PENDING'
      },
      include: {
        task: true,
        approver: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { task: { riskLevel: 'desc' } },
        { createdAt: 'asc' }
      ],
      take: 5
    })
  } catch {}

  // Calculate key metrics
  const cashGap = cashTarget ? cashTarget.targetAmount - currentCashFlow : 0
  const daysToTarget = cashTarget 
    ? Math.ceil((cashTarget.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const formatCurrency = (amount: number) => {
    const crores = amount / 10000000
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`
    }
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(0)} L`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-600">{project.city} • Dashboard</p>
              {isStub && (
                <p className="text-xs text-orange-600 mt-1">Demo mode: showing stub data (no DB/login required)</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Target className="mr-2 h-4 w-4" />
                Set Target
              </Button>
              <RunPlannerButton projectId={project.id} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Current Cash Flow</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(currentCashFlow)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Target Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cashTarget ? formatCurrency(cashTarget.targetAmount) : 'Not Set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cash Gap</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Math.max(0, cashGap))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-sm">{daysToTarget}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Days to Target</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {cashTarget ? cashTarget.targetDate.toLocaleDateString('en-IN') : 'Not Set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cash Curve */}
          <div className="lg:col-span-2 space-y-6">
            <CashCurve 
              projectId={project.id}
              currentAmount={currentCashFlow}
              targetAmount={cashTarget?.targetAmount || 0}
              targetDate={cashTarget?.targetDate}
            />
            
            <TodayQueue tasks={todayTasks} />
          </div>

          {/* Right Column - Approvals & Risk */}
          <div className="space-y-6">
            <ApprovalsInbox approvals={pendingApprovals} />
            
            <RiskPanel 
              projectId={project.id}
              cashGap={cashGap}
              daysToTarget={daysToTarget}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
