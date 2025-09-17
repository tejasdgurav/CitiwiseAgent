'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react'

interface Approval {
  id: string
  state: string
  createdAt: Date
  task: {
    id: string
    agentType: string
    actionType: string
    payload: any
    riskLevel: string
    cashImpactDelta?: number | null
    reasonShort?: string | null
  }
  approver: {
    name: string | null
    email: string
  }
}

interface ApprovalsInboxProps {
  approvals: Approval[]
}

export function ApprovalsInbox({ approvals }: ApprovalsInboxProps) {
  const [processingApproval, setProcessingApproval] = useState<string | null>(null)

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

  const handleApproval = async (taskId: string, decision: 'APPROVED' | 'REJECTED', note?: string) => {
    setProcessingApproval(taskId)
    
    try {
      const response = await fetch('/api/agent/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          decision,
          note,
        }),
      })

      if (response.ok) {
        // Refresh the page or update state
        window.location.reload()
      } else {
        throw new Error('Failed to process approval')
      }
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to process approval. Please try again.')
    } finally {
      setProcessingApproval(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Approvals Inbox</CardTitle>
          <Badge variant="secondary">{approvals.length} pending</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No pending approvals</p>
            <p className="text-xs text-gray-400">All tasks are approved or auto-executed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => {
              const task = approval.task
              const isProcessing = processingApproval === task.id
              
              return (
                <div
                  key={approval.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {task.agentType} • {task.actionType}
                        </div>
                        <div className="text-xs text-gray-600">
                          {task.reasonShort || 'No description provided'}
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getRiskColor(task.riskLevel)}`}
                    >
                      {task.riskLevel} RISK
                    </Badge>
                  </div>

                  {/* Cash Impact */}
                  {task.cashImpactDelta && (
                    <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        Cash Impact: 
                        <span className={`ml-1 font-medium ${
                          task.cashImpactDelta > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(task.cashImpactDelta)}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Task Details */}
                  {task.payload && Object.keys(task.payload).length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
                      <div className="font-medium text-blue-900 mb-1">Task Details:</div>
                      <div className="text-blue-800 space-y-1">
                        {Object.entries(task.payload).slice(0, 3).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 100)}
                            {String(value).length > 100 && '...'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        Requested {new Date(approval.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(task.id, 'REJECTED')}
                        disabled={isProcessing}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleApproval(task.id, 'APPROVED')}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  {task.riskLevel === 'HIGH' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <div className="font-medium text-red-900 mb-1">⚠️ High Risk Action</div>
                      <div className="text-red-800">
                        This action requires careful review. Consider the cash impact and policy compliance before approving.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {approvals.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {approvals.filter(a => a.task.riskLevel === 'HIGH').length} high risk • 
                {approvals.filter(a => a.task.riskLevel === 'MEDIUM').length} medium risk
              </span>
              <Button variant="ghost" size="sm" className="text-xs h-6">
                View History
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
