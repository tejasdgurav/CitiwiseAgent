'use client'

import { useState } from 'react'
import { Unit, Tower, Project } from '@prisma/client'
import { calculateCompletePricing } from '@/lib/pricing/engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, CreditCard, Shield } from 'lucide-react'

interface UnitWithRelations extends Unit {
  tower: Tower & {
    project: Project
  }
}

interface TokenButtonProps {
  unit: UnitWithRelations
  dealCode: string
  customerName: string
}

export function TokenButton({ unit, dealCode, customerName }: TokenButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const pricing = calculateCompletePricing({
    basePrice: unit.basePrice,
    carpetArea: unit.carpetArea,
    plcMap: {
      default: unit.plc ? unit.plc / unit.carpetArea : 0,
    },
    floorRise: unit.floorRise ? unit.floorRise / unit.carpetArea : 0,
    parking: unit.parking || 0,
    gstRate: 5,
    stampDutyRate: 5,
    registrationFee: 30000,
  })

  const tokenAmount = 100000 // ₹1 Lakh token amount
  
  const formatPrice = (amount: number) => {
    return `₹${(amount / 100000).toFixed(0)} L`
  }

  const handleTokenPayment = async () => {
    setIsLoading(true)
    
    try {
      // Create token payment link
      const response = await fetch('/api/payments/create-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealCode,
          unitId: unit.id,
          amount: tokenAmount,
          customerName,
        }),
      })

      if (response.ok) {
        const { paymentUrl } = await response.json()
        // Redirect to payment gateway
        window.location.href = paymentUrl
      } else {
        throw new Error('Failed to create payment link')
      }
    } catch (error) {
      console.error('Token payment error:', error)
      alert('Unable to process payment. Please try again or contact support.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-900">
              {unit.bhk} BHK - {unit.unitNumber}
            </h4>
            <p className="text-sm text-gray-600">
              Total: {formatPrice(pricing.breakdown.totalAmount)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatPrice(tokenAmount)}
            </div>
            <div className="text-xs text-gray-500">Token Amount</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure your unit for 7 days</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <span>100% refundable if you change your mind</span>
          </div>

          <Button
            onClick={handleTokenPayment}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Token - {formatPrice(tokenAmount)}
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            By proceeding, you agree to our terms and conditions. 
            Token amount will be adjusted against the total property price.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
