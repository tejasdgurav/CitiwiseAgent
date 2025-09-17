'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, CheckCircle, Play } from 'lucide-react'

interface Task {
  id: string
  agentType: string
  actionType: string
  payload: any
  status: string
  riskLevel: string
  cashImpactDelta?: number | null
  reasonShort?: string | null
  createdAt: Date
  approvals: any[]
}

interface TodayQueueProps {
  tasks: Task[]
}

export function TodayQueue({ tasks }: TodayQueueProps) {
  const formatCurrency = (amount: number) => {
    if (!amount) return ''
    const lakhs = Math.abs(amount) / 100000
    const sign = amount < 0 ? '-' : '+'
    return `${sign}₹${lakhs.toFixed(0)}L`
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string, hasApprovals: boolean) => {
    if (hasApprovals) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    switch (status) {
      case 'PENDING': return <Play className="h-4 w-4 text-blue-500" />
      case 'IN_PROGRESS': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const handleExecuteTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/agent/execute-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to execute task')
      }
      // Refresh to reflect updated task status
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e: any) {
      alert(e?.message || 'Failed to execute task')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Queue</CardTitle>
          <Badge variant="secondary">{tasks.length} tasks</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No tasks in queue</p>
            <p className="text-xs text-gray-400">All caught up for today!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const hasApprovals = task.approvals.length > 0
              const needsApproval = hasApprovals && task.approvals.some(a => a.state === 'PENDING')
              
              return (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status, needsApproval)}
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {task.agentType} • {task.actionType}
                        </div>
                        <div className="text-xs text-gray-600">
                          {task.reasonShort || 'No description'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {task.cashImpactDelta && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          task.cashImpactDelta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {formatCurrency(task.cashImpactDelta)}
                        </span>
                      )}
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRiskColor(task.riskLevel)}`}
                      >
                        {task.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Created {new Date(task.createdAt).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {needsApproval ? (
                        <Badge variant="outline" className="text-xs text-yellow-700 bg-yellow-50">
                          Awaiting Approval
                        </Badge>
                      ) : task.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExecuteTask(task.id)}
                          className="text-xs h-7"
                        >
                          Execute
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Task Payload Preview */}
                  {task.payload && Object.keys(task.payload).length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <div className="font-medium text-gray-700 mb-1">Details:</div>
                      <div className="text-gray-600">
                        {Object.entries(task.payload).slice(0, 2).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 50)}
                            {String(value).length > 50 && '...'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {tasks.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {tasks.filter(t => t.status === 'PENDING').length} pending • 
                {tasks.filter(t => t.approvals.some(a => a.state === 'PENDING')).length} awaiting approval
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-6">
                View All
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
