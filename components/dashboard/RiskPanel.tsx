'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingDown, Clock, Shield } from 'lucide-react'

interface RiskPanelProps {
  projectId: string
  cashGap: number
  daysToTarget: number
}

export function RiskPanel({ projectId, cashGap, daysToTarget }: RiskPanelProps) {
  const formatCurrency = (amount: number) => {
    const crores = amount / 10000000
    if (crores >= 1) {
      return `₹${crores.toFixed(1)}Cr`
    }
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(0)}L`
  }

  // Calculate risk level based on cash gap and time
  const getRiskLevel = () => {
    if (cashGap > 50000000 && daysToTarget < 30) return 'HIGH'
    if (cashGap > 20000000 && daysToTarget < 60) return 'MEDIUM'
    if (cashGap > 0) return 'LOW'
    return 'NONE'
  }

  const riskLevel = getRiskLevel()

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'HIGH': return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'MEDIUM': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'LOW': return <TrendingDown className="h-5 w-5 text-blue-600" />
      default: return <Shield className="h-5 w-5 text-green-600" />
    }
  }

  const getRiskMessage = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'Urgent action required to meet cash target. Consider aggressive sales strategies.'
      case 'MEDIUM':
        return 'Moderate risk. Monitor closely and consider additional marketing efforts.'
      case 'LOW':
        return 'On track but requires consistent execution of planned activities.'
      default:
        return 'Target achieved or on track. Maintain current momentum.'
    }
  }

  const getRecommendations = (level: string) => {
    switch (level) {
      case 'HIGH':
        return [
          'Release additional inventory',
          'Offer limited-time discounts',
          'Increase marketing spend',
          'Focus on high-value leads'
        ]
      case 'MEDIUM':
        return [
          'Accelerate lead qualification',
          'Follow up on pending tokens',
          'Schedule more site visits',
          'Review pricing strategy'
        ]
      case 'LOW':
        return [
          'Continue current activities',
          'Optimize conversion rates',
          'Maintain lead quality',
          'Monitor market conditions'
        ]
      default:
        return [
          'Maintain current strategy',
          'Focus on customer satisfaction',
          'Plan for next phase',
          'Document best practices'
        ]
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Risk Assessment</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Level Indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
          {getRiskIcon(riskLevel)}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">Risk Level</span>
              <Badge className={getRiskColor(riskLevel)}>
                {riskLevel === 'NONE' ? 'ON TRACK' : `${riskLevel} RISK`}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {getRiskMessage(riskLevel)}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="text-xs text-red-600 font-medium mb-1">Cash Gap</div>
            <div className="text-lg font-bold text-red-900">
              {formatCurrency(Math.max(0, cashGap))}
            </div>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 font-medium mb-1">Days Left</div>
            <div className="text-lg font-bold text-orange-900">
              {Math.max(0, daysToTarget)}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <div className="font-medium text-gray-900 mb-2">Recommended Actions</div>
          <div className="space-y-2">
            {getRecommendations(riskLevel).map((recommendation, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                <span className="text-gray-700">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full" size="sm">
            Run Emergency Planner
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            View Risk Details
          </Button>
        </div>

        {/* Risk Factors */}
        <div className="pt-3 border-t">
          <div className="text-sm font-medium text-gray-900 mb-2">Risk Factors</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Market Conditions</span>
              <span className="text-green-600">Favorable</span>
            </div>
            <div className="flex justify-between">
              <span>Inventory Levels</span>
              <span className="text-yellow-600">Moderate</span>
            </div>
            <div className="flex justify-between">
              <span>Lead Quality</span>
              <span className="text-green-600">Good</span>
            </div>
            <div className="flex justify-between">
              <span>Conversion Rate</span>
              <span className="text-blue-600">12.5%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
