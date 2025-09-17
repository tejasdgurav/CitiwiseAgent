import OpenAI from 'openai'
import { logger } from '@/lib/logging'
import { type PlannerContext, type TaskInput } from '@/lib/tasks/planner'

export class AIPlanner {
  private client: OpenAI | null

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    this.client = apiKey ? new OpenAI({ apiKey }) : null
  }

  isEnabled() {
    return !!this.client
  }

  async proposeTasks(context: PlannerContext): Promise<TaskInput[]> {
    if (!this.client) {
      return []
    }

    try {
      const sys = `You are Citiwise, an agent OS that plans cash-in tasks for Indian real-estate developers. 
- Only propose concrete, actionable tasks that can be executed programmatically.
- Each task has: agentType, actionType, payload, riskLevel (LOW/MEDIUM/HIGH), optional cashImpactDelta, optional reasonShort.
- Respect policy basics: discounts under 10% are MEDIUM risk; above 10% HIGH risk; WhatsApp nudges are LOW risk; releasing inventory MEDIUM risk.`

      const user = `Project Context:
- projectId: ${context.projectId}
- currentCashFlow: ${context.currentCashFlow}
- targetAmount: ${context.targetAmount}
- targetDateISO: ${context.targetDate.toISOString()}
- activeTasks: ${context.activeTasks}
- pendingApprovals: ${context.pendingApprovals}

Return a JSON array of 3-6 tasks, no narration.`

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' as any },
      })

      const text = completion.choices[0]?.message?.content || '{}'
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        parsed = { tasks: [] }
      }

      const tasks: TaskInput[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.tasks)
        ? parsed.tasks
        : []

      // Sanitize required fields minimally
      const cleaned: TaskInput[] = tasks
        .map((t: any) => ({
          agentType: String(t.agentType || ''),
          actionType: String(t.actionType || ''),
          payload: t.payload ?? {},
          riskLevel: (['LOW', 'MEDIUM', 'HIGH'].includes(String(t.riskLevel))
            ? t.riskLevel
            : 'LOW') as any,
          cashImpactDelta: typeof t.cashImpactDelta === 'number' ? t.cashImpactDelta : undefined,
          reasonShort: typeof t.reasonShort === 'string' ? t.reasonShort : undefined,
        }))
        .filter((t: TaskInput) => t.agentType && t.actionType)

      return cleaned
    } catch (error) {
      logger.error('AIPlanner.proposeTasks failed', { error })
      return []
    }
  }
}
