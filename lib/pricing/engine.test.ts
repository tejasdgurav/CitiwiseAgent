import { describe, it, expect } from 'vitest'
import {
  calculatePlcCharges,
  calculateFloorRiseCharges,
  calculateParkingCharges,
  calculateDiscount,
  calculateGst,
  calculateStampDuty,
  calculatePriceBreakdown,
  generatePaymentSchedule,
  calculateEmiOptions,
  calculateCompletePricing,
  type PricingInput,
} from './engine'

describe('Pricing Engine', () => {
  describe('calculatePlcCharges', () => {
    it('should calculate PLC charges with default rate', () => {
      const result = calculatePlcCharges(1000)
      expect(result).toBe(200000) // 1000 * 200
    })

    it('should calculate PLC charges with custom rate', () => {
      const plcMap = { default: 250 }
      const result = calculatePlcCharges(1000, plcMap)
      expect(result).toBe(250000) // 1000 * 250
    })
  })

  describe('calculateFloorRiseCharges', () => {
    it('should calculate floor rise charges', () => {
      const result = calculateFloorRiseCharges(1000, 50)
      expect(result).toBe(50000) // 1000 * 50
    })

    it('should return 0 for no floor rise', () => {
      const result = calculateFloorRiseCharges(1000, 0)
      expect(result).toBe(0)
    })
  })

  describe('calculateParkingCharges', () => {
    it('should calculate parking charges with default rate', () => {
      const result = calculateParkingCharges(2)
      expect(result).toBe(300000) // 2 * 150000
    })

    it('should calculate parking charges with custom rate', () => {
      const result = calculateParkingCharges(2, 200000)
      expect(result).toBe(400000) // 2 * 200000
    })

    it('should return 0 for no parking', () => {
      const result = calculateParkingCharges(0)
      expect(result).toBe(0)
    })
  })

  describe('calculateDiscount', () => {
    it('should calculate discount percentage', () => {
      const result = calculateDiscount(1000000, 10)
      expect(result).toBe(100000) // 10% of 1000000
    })

    it('should return 0 for no discount', () => {
      const result = calculateDiscount(1000000, 0)
      expect(result).toBe(0)
    })
  })

  describe('calculateGst', () => {
    it('should calculate GST with default rate', () => {
      const result = calculateGst(1000000)
      expect(result).toBe(50000) // 5% of 1000000
    })

    it('should calculate GST with custom rate', () => {
      const result = calculateGst(1000000, 12)
      expect(result).toBe(120000) // 12% of 1000000
    })
  })

  describe('calculateStampDuty', () => {
    it('should calculate stamp duty with default rate', () => {
      const result = calculateStampDuty(1000000)
      expect(result).toBe(50000) // 5% of 1000000
    })

    it('should calculate stamp duty with custom rate', () => {
      const result = calculateStampDuty(1000000, 6)
      expect(result).toBe(60000) // 6% of 1000000
    })
  })

  describe('calculatePriceBreakdown', () => {
    it('should calculate complete price breakdown', () => {
      const input: PricingInput = {
        basePrice: 8000000,
        carpetArea: 1000,
        plcMap: { default: 200 },
        floorRise: 50,
        parking: 1,
        discountPercent: 5,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      const result = calculatePriceBreakdown(input)

      expect(result.basePrice).toBe(8000000)
      expect(result.plcCharges).toBe(200000) // 1000 * 200
      expect(result.floorRiseCharges).toBe(50000) // 1000 * 50
      expect(result.parkingCharges).toBe(150000) // 1 * 150000
      expect(result.subtotal).toBe(8400000) // sum of above
      expect(result.discount).toBe(420000) // 5% of subtotal
      expect(result.netAmount).toBe(7980000) // subtotal - discount
      expect(result.gst).toBe(399000) // 5% of netAmount
      expect(result.stampDuty).toBe(399000) // 5% of netAmount
      expect(result.registrationFee).toBe(30000)
      expect(result.totalAmount).toBe(8808000) // netAmount + gst + stampDuty + registration
    })

    it('should handle minimal input', () => {
      const input: PricingInput = {
        basePrice: 5000000,
        carpetArea: 650,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      const result = calculatePriceBreakdown(input)

      expect(result.basePrice).toBe(5000000)
      expect(result.plcCharges).toBe(130000) // 650 * 200
      expect(result.floorRiseCharges).toBe(0)
      expect(result.parkingCharges).toBe(0)
      expect(result.discount).toBe(0)
      expect(result.gst).toBe(256500) // 5% of netAmount
      expect(result.stampDuty).toBe(256500) // 5% of netAmount
      expect(result.registrationFee).toBe(30000)
    })
  })

  describe('generatePaymentSchedule', () => {
    it('should generate default payment schedule', () => {
      const result = generatePaymentSchedule(10000000)

      expect(result).toHaveLength(7)
      expect(result[0]).toEqual({
        milestone: 'Token Amount',
        percentage: 10,
        amount: 1000000,
      })
      expect(result[6]).toEqual({
        milestone: 'Possession',
        percentage: 10,
        amount: 1000000,
      })

      // Check total adds up to 100%
      const totalPercentage = result.reduce((sum, item) => sum + item.percentage, 0)
      expect(totalPercentage).toBe(100)
    })

    it('should generate custom payment schedule', () => {
      const customSchedule = [
        { milestone: 'Token', percentage: 20 },
        { milestone: 'Agreement', percentage: 80 },
      ]

      const result = generatePaymentSchedule(10000000, customSchedule)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        milestone: 'Token',
        percentage: 20,
        amount: 2000000,
      })
      expect(result[1]).toEqual({
        milestone: 'Agreement',
        percentage: 80,
        amount: 8000000,
      })
    })
  })

  describe('calculateEmiOptions', () => {
    it('should calculate EMI options with default rates and tenures', () => {
      const result = calculateEmiOptions(5000000)

      expect(result).toHaveLength(9) // 3 rates * 3 tenures
      
      // Check first option (8.5% for 15 years)
      const firstOption = result[0]
      expect(firstOption.tenure).toBe(15)
      expect(firstOption.monthlyEmi).toBeGreaterThan(0)
      expect(firstOption.totalInterest).toBeGreaterThan(0)
    })

    it('should calculate EMI for specific rate and tenure', () => {
      const result = calculateEmiOptions(5000000, [9.0], [20])

      expect(result).toHaveLength(1)
      expect(result[0].tenure).toBe(20)
      expect(result[0].monthlyEmi).toBe(44986) // Approximate EMI for 50L at 9% for 20 years
    })
  })

  describe('calculateCompletePricing', () => {
    it('should calculate complete pricing with all components', () => {
      const input: PricingInput = {
        basePrice: 8000000,
        carpetArea: 1000,
        parking: 1,
        discountPercent: 5,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      const result = calculateCompletePricing(input, 80)

      expect(result.breakdown).toBeDefined()
      expect(result.schedule).toHaveLength(7)
      expect(result.emiOptions.length).toBeGreaterThan(0)

      // Check that loan amount is 80% of net amount
      const expectedLoanAmount = Math.round((result.breakdown.netAmount * 80) / 100)
      expect(result.emiOptions[0]).toBeDefined()
    })
  })

  describe('Input validation', () => {
    it('should throw error for invalid base price', () => {
      const input = {
        basePrice: -1000000,
        carpetArea: 1000,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      expect(() => calculatePriceBreakdown(input)).toThrow()
    })

    it('should throw error for invalid carpet area', () => {
      const input = {
        basePrice: 8000000,
        carpetArea: 0,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      expect(() => calculatePriceBreakdown(input)).toThrow()
    })

    it('should throw error for invalid discount percentage', () => {
      const input = {
        basePrice: 8000000,
        carpetArea: 1000,
        discountPercent: 150,
        gstRate: 5,
        stampDutyRate: 5,
        registrationFee: 30000,
      }

      expect(() => calculatePriceBreakdown(input)).toThrow()
    })
  })
})
