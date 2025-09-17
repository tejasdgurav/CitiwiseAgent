import { z } from 'zod'

// Input schemas for validation
export const PricingInputSchema = z.object({
  basePrice: z.number().positive(),
  carpetArea: z.number().positive(),
  plcMap: z.record(z.string(), z.number()).optional(),
  floorRise: z.number().min(0).optional(),
  parking: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  gstRate: z.number().min(0).max(30).default(5),
  stampDutyRate: z.number().min(0).max(10).default(5),
  registrationFee: z.number().min(0).default(30000),
})

export type PricingInput = z.infer<typeof PricingInputSchema>

export interface PriceBreakdown {
  basePrice: number
  plcCharges: number
  floorRiseCharges: number
  parkingCharges: number
  subtotal: number
  discount: number
  netAmount: number
  gst: number
  stampDuty: number
  registrationFee: number
  totalAmount: number
}

export interface PaymentSchedule {
  milestone: string
  percentage: number
  amount: number
  dueDate?: string
}

export interface PricingResult {
  breakdown: PriceBreakdown
  schedule: PaymentSchedule[]
  emiOptions: {
    tenure: number
    monthlyEmi: number
    totalInterest: number
  }[]
}

// Pure pricing calculation functions
export function calculatePlcCharges(
  carpetArea: number,
  plcMap: Record<string, number> = {}
): number {
  // Default PLC rates per sq ft
  const defaultPlcRate = plcMap.default || 200
  return carpetArea * defaultPlcRate
}

export function calculateFloorRiseCharges(
  carpetArea: number,
  floorRise: number = 0
): number {
  return carpetArea * floorRise
}

export function calculateParkingCharges(
  parkingSpaces: number = 0,
  ratePerSpace: number = 150000
): number {
  return parkingSpaces * ratePerSpace
}

export function calculateDiscount(
  subtotal: number,
  discountPercent: number = 0
): number {
  return (subtotal * discountPercent) / 100
}

export function calculateGst(netAmount: number, gstRate: number = 5): number {
  return (netAmount * gstRate) / 100
}

export function calculateStampDuty(
  netAmount: number,
  stampDutyRate: number = 5
): number {
  return (netAmount * stampDutyRate) / 100
}

export function calculatePriceBreakdown(input: PricingInput): PriceBreakdown {
  const validatedInput = PricingInputSchema.parse(input)
  
  const {
    basePrice,
    carpetArea,
    plcMap = {},
    floorRise = 0,
    parking = 0,
    discountPercent = 0,
    gstRate,
    stampDutyRate,
    registrationFee,
  } = validatedInput

  const plcCharges = calculatePlcCharges(carpetArea, plcMap)
  const floorRiseCharges = calculateFloorRiseCharges(carpetArea, floorRise)
  const parkingCharges = calculateParkingCharges(parking)
  
  const subtotal = basePrice + plcCharges + floorRiseCharges + parkingCharges
  const discount = calculateDiscount(subtotal, discountPercent)
  const netAmount = subtotal - discount
  
  const gst = calculateGst(netAmount, gstRate)
  const stampDuty = calculateStampDuty(netAmount, stampDutyRate)
  const totalAmount = netAmount + gst + stampDuty + registrationFee

  return {
    basePrice,
    plcCharges,
    floorRiseCharges,
    parkingCharges,
    subtotal,
    discount,
    netAmount,
    gst,
    stampDuty,
    registrationFee,
    totalAmount,
  }
}

export function generatePaymentSchedule(
  totalAmount: number,
  customSchedule?: { milestone: string; percentage: number }[]
): PaymentSchedule[] {
  const defaultSchedule = [
    { milestone: 'Token Amount', percentage: 10 },
    { milestone: 'Agreement', percentage: 10 },
    { milestone: 'Foundation', percentage: 15 },
    { milestone: 'Plinth', percentage: 15 },
    { milestone: 'Slab', percentage: 20 },
    { milestone: 'Finishing', percentage: 20 },
    { milestone: 'Possession', percentage: 10 },
  ]

  const schedule = customSchedule || defaultSchedule

  return schedule.map((item) => ({
    milestone: item.milestone,
    percentage: item.percentage,
    amount: Math.round((totalAmount * item.percentage) / 100),
  }))
}

export function calculateEmiOptions(
  loanAmount: number,
  interestRates: number[] = [8.5, 9.0, 9.5],
  tenures: number[] = [15, 20, 25]
): { tenure: number; monthlyEmi: number; totalInterest: number }[] {
  const options: { tenure: number; monthlyEmi: number; totalInterest: number }[] = []

  for (const rate of interestRates) {
    for (const tenure of tenures) {
      const monthlyRate = rate / 100 / 12
      const totalMonths = tenure * 12
      
      const emi = Math.round(
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      )
      
      const totalInterest = Math.round(emi * totalMonths - loanAmount)
      
      options.push({
        tenure,
        monthlyEmi: emi,
        totalInterest,
      })
    }
  }

  return options
}

export function calculateCompletePricing(
  input: PricingInput,
  loanPercentage: number = 80
): PricingResult {
  const breakdown = calculatePriceBreakdown(input)
  const schedule = generatePaymentSchedule(breakdown.totalAmount)
  
  const loanAmount = Math.round((breakdown.netAmount * loanPercentage) / 100)
  const emiOptions = calculateEmiOptions(loanAmount)

  return {
    breakdown,
    schedule,
    emiOptions,
  }
}
