'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, Calendar } from 'lucide-react'

interface CashCurveProps {
  projectId: string
  currentAmount: number
  targetAmount: number
  targetDate?: Date
}

export function CashCurve({ projectId, currentAmount, targetAmount, targetDate }: CashCurveProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Generate sample data points for the curve
    const generateCurveData = () => {
      const data = []
      const today = new Date()
      const target = targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      const daysToTarget = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Historical data (last 30 days)
      for (let i = 30; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        const progress = Math.max(0, (30 - i) / 30)
        const amount = currentAmount * progress + Math.random() * 1000000
        
        data.push({
          date: date.toISOString().split('T')[0],
          actual: Math.round(amount),
          projected: null,
          target: null
        })
      }
      
      // Future projections
      for (let i = 1; i <= daysToTarget; i++) {
        const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
        const progress = i / daysToTarget
        const projected = currentAmount + (targetAmount - currentAmount) * progress
        
        data.push({
          date: date.toISOString().split('T')[0],
          actual: null,
          projected: Math.round(projected),
          target: i === daysToTarget ? targetAmount : null
        })
      }
      
      return data
    }

    setChartData(generateCurveData())
  }, [currentAmount, targetAmount, targetDate])

  const formatCurrency = (amount: number) => {
    const crores = amount / 10000000
    if (crores >= 1) {
      return `₹${crores.toFixed(1)}Cr`
    }
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(0)}L`
  }

  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Cash Flow Curve</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {targetDate ? `Target: ${targetDate.toLocaleDateString('en-IN')}` : 'No target set'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to Target</span>
            <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatCurrency(currentAmount)}</span>
            <span>{formatCurrency(targetAmount)}</span>
          </div>
        </div>

        {/* Simple Chart Visualization */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-xs text-gray-500 text-center">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }, (_, i) => {
              const isToday = i === 20 // Simulate today
              const isPast = i < 20
              const height = isPast 
                ? Math.min(100, (i / 20) * 100) 
                : Math.max(20, 100 - (i - 20) * 10)
              
              return (
                <div key={i} className="flex flex-col items-center">
                  <div 
                    className={`w-full rounded-sm ${
                      isToday 
                        ? 'bg-blue-600' 
                        : isPast 
                          ? 'bg-green-400' 
                          : 'bg-gray-300'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {i + 1}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded-sm" />
              <span className="text-gray-600">Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 rounded-sm" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded-sm" />
              <span className="text-gray-600">Projected</span>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Daily Average</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {formatCurrency(currentAmount / 30)}
            </div>
            <div className="text-xs text-blue-700">Last 30 days</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Required Daily</span>
            </div>
            <div className="text-lg font-bold text-orange-900">
              {targetDate ? formatCurrency((targetAmount - currentAmount) / Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))) : 'N/A'}
            </div>
            <div className="text-xs text-orange-700">To meet target</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button size="sm" className="flex-1">
            Run Planner
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
