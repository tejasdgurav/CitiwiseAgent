'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Target } from 'lucide-react'

interface RunPlannerButtonProps {
  projectId: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function RunPlannerButton({ projectId, size = 'sm', variant = 'default' }: RunPlannerButtonProps) {
  const [loading, setLoading] = useState(false)

  const runPlanner = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) throw new Error('Planner failed')
      const data = await res.json()
      alert(`Planner generated ${data.tasksGenerated} tasks.\nCash gap: ₹${Math.round((data.context.cashGap || 0) / 100000)} L`)
      // Optionally refresh
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e) {
      console.error(e)
      alert('Failed to run planner. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={runPlanner} size={size} variant={variant} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Running...
        </>
      ) : (
        <>
          <Target className="mr-2 h-4 w-4" />
          Run Planner
        </>
      )}
    </Button>
  )
}
