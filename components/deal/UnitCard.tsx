'use client'

import { Unit, Tower, Project } from '@prisma/client'
import { calculateCompletePricing } from '@/lib/pricing/engine'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface UnitWithRelations extends Unit {
  tower: Tower & {
    project: Project
  }
}

interface UnitCardProps {
  unit: UnitWithRelations
  isRecommended?: boolean
  dealCode: string
}

export function UnitCard({ unit, isRecommended = false, dealCode }: UnitCardProps) {
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

  const formatPrice = (amount: number) => {
    const crores = amount / 10000000
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`
    }
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(0)} L`
  }

  return (
    <Card className={`relative ${isRecommended ? 'ring-2 ring-blue-500' : ''}`}>
      {isRecommended && (
        <div className="absolute -top-2 left-4 z-10">
          <Badge className="bg-blue-500 text-white">Recommended</Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {unit.bhk} BHK - {unit.unitNumber}
            </h3>
            <p className="text-sm text-gray-600">
              {unit.tower.name}, Floor {unit.unitNumber.slice(-2)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(pricing.breakdown.totalAmount)}
            </div>
            <div className="text-xs text-gray-500">All inclusive</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Unit Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Carpet Area</span>
            <div className="font-medium">{unit.carpetArea} sq ft</div>
          </div>
          <div>
            <span className="text-gray-600">Parking</span>
            <div className="font-medium">{unit.parking || 0} spaces</div>
          </div>
          <div>
            <span className="text-gray-600">Vastu</span>
            <div className="font-medium">{unit.vastu || 'N/A'}</div>
          </div>
          <div>
            <span className="text-gray-600">Status</span>
            <div className="font-medium text-green-600">Available</div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border-t pt-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Price Breakdown</div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Base Price</span>
              <span>{formatPrice(pricing.breakdown.basePrice)}</span>
            </div>
            {pricing.breakdown.plcCharges > 0 && (
              <div className="flex justify-between">
                <span>PLC Charges</span>
                <span>{formatPrice(pricing.breakdown.plcCharges)}</span>
              </div>
            )}
            {pricing.breakdown.floorRiseCharges > 0 && (
              <div className="flex justify-between">
                <span>Floor Rise</span>
                <span>{formatPrice(pricing.breakdown.floorRiseCharges)}</span>
              </div>
            )}
            {pricing.breakdown.parkingCharges > 0 && (
              <div className="flex justify-between">
                <span>Parking</span>
                <span>{formatPrice(pricing.breakdown.parkingCharges)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span>{formatPrice(pricing.breakdown.gst)}</span>
            </div>
            <div className="flex justify-between">
              <span>Stamp Duty & Registration</span>
              <span>{formatPrice(pricing.breakdown.stampDuty + pricing.breakdown.registrationFee)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900 border-t pt-1">
              <span>Total Amount</span>
              <span>{formatPrice(pricing.breakdown.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="border-t pt-3">
          <div className="text-sm font-medium text-gray-900 mb-2">Key Features</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {unit.usage || 'Residential'}
            </Badge>
            {unit.vastu && (
              <Badge variant="secondary" className="text-xs">
                {unit.vastu} Facing
              </Badge>
            )}
            {unit.parking && unit.parking > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unit.parking} Parking
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Ready to Move
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
