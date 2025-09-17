import { RiskLevel } from '@prisma/client'

// Types representing policy configuration. In production this can be loaded per-project
// from `Project.policies` (JSON) and validated with Zod.
export type ActionType =
  | 'releaseUnits'
  | 'generateDealPage'
  | 'sendWhatsAppTemplate'
  | 'createOffer'
  | 'followUpDealPage'

export interface PolicyRule {
  actionType: ActionType | string
  maxDiscountPercent?: number // for createOffer
  requireApprovalAboveCashImpact?: number // in INR
  defaultRisk?: RiskLevel
  blocked?: boolean
}

export interface PolicyConfig {
  // Allow-list of actions the agent may perform
  allowedActions: (ActionType | string)[]
  // Per-action rules
  rules: PolicyRule[]
}

export interface PolicyEvaluation {
  riskLevel: RiskLevel
  requiresApproval: boolean
  violations: string[]
}

export interface TaskCandidate {
  agentType: string
  actionType: string
  payload: any
  cashImpactDelta?: number
}

// Default policy for development/demo. Production should persist per-project.
export const defaultPolicy: PolicyConfig = {
  allowedActions: [
    'releaseUnits',
    'generateDealPage',
    'sendWhatsAppTemplate',
    'createOffer',
    'followUpDealPage',
  ],
  rules: [
    {
      actionType: 'releaseUnits',
      defaultRisk: 'MEDIUM',
      requireApprovalAboveCashImpact: 0,
    },
    {
      actionType: 'generateDealPage',
      defaultRisk: 'LOW',
    },
    {
      actionType: 'sendWhatsAppTemplate',
      defaultRisk: 'LOW',
    },
    {
      actionType: 'createOffer',
      defaultRisk: 'HIGH',
      maxDiscountPercent: 10,
      requireApprovalAboveCashImpact: 0,
    },
    {
      actionType: 'followUpDealPage',
      defaultRisk: 'LOW',
    },
  ],
}

export function evaluateTaskAgainstPolicy(
  task: TaskCandidate,
  policy: PolicyConfig = defaultPolicy
): PolicyEvaluation {
  const violations: string[] = []
  // 1. Allow-list check
  if (!policy.allowedActions.includes(task.actionType)) {
    violations.push(`Action ${task.actionType} is not allowed by policy`)
  }

  // 2. Per-action rules
  const rule = policy.rules.find((r) => r.actionType === task.actionType)
  let riskLevel: RiskLevel = rule?.defaultRisk || 'LOW'
  let requiresApproval = false

  if (task.actionType === 'createOffer') {
    const discountPercent: number | undefined = task.payload?.discountPercent
    if (typeof discountPercent === 'number' && rule?.maxDiscountPercent != null) {
      if (discountPercent > rule.maxDiscountPercent) {
        violations.push(
          `Discount ${discountPercent}% exceeds policy max ${rule.maxDiscountPercent}%`
        )
        riskLevel = 'HIGH'
        requiresApproval = true
      }
    }
  }

  // 3. Cash impact thresholds
  const cashImpact = Math.abs(task.cashImpactDelta || 0)
  if (rule?.requireApprovalAboveCashImpact != null) {
    if (cashImpact > rule.requireApprovalAboveCashImpact) {
      requiresApproval = true
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM'
    }
  }

  return { riskLevel, requiresApproval, violations }
}
