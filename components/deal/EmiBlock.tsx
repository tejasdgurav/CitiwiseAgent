'use client'

import { useState } from 'react'
import { Unit, Tower, Project } from '@prisma/client'
import { calculateCompletePricing } from '@/lib/pricing/engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface UnitWithRelations extends Unit {
  tower: Tower & {
    project: Project
  }
}

interface EmiBlockProps {
  units: UnitWithRelations[]
}

export function EmiBlock({ units }: EmiBlockProps) {
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0)
  const [loanPercentage, setLoanPercentage] = useState([80])
  const [selectedTenure, setSelectedTenure] = useState(20)

  const selectedUnit = units[selectedUnitIndex]
  
  const pricing = calculateCompletePricing({
    basePrice: selectedUnit.basePrice,
    carpetArea: selectedUnit.carpetArea,
    plcMap: {
      default: selectedUnit.plc ? selectedUnit.plc / selectedUnit.carpetArea : 0,
    },
    floorRise: selectedUnit.floorRise ? selectedUnit.floorRise / selectedUnit.carpetArea : 0,
    parking: selectedUnit.parking || 0,
    gstRate: 5,
    stampDutyRate: 5,
    registrationFee: 30000,
  }, loanPercentage[0])

  const formatPrice = (amount: number) => {
    const lakhs = amount / 100000
    if (lakhs >= 100) {
      return `₹${(lakhs / 100).toFixed(2)} Cr`
    }
    return `₹${lakhs.toFixed(0)} L`
  }

  const formatEmi = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const loanAmount = Math.round((pricing.breakdown.netAmount * loanPercentage[0]) / 100)
  const downPayment = pricing.breakdown.totalAmount - loanAmount
  
  // Find EMI for selected tenure
  const selectedEmi = pricing.emiOptions.find(option => option.tenure === selectedTenure)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">EMI Calculator</CardTitle>
        <p className="text-sm text-gray-600">
          Calculate your monthly EMI and plan your investment
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Unit Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Select Unit
          </label>
          <div className="grid grid-cols-1 gap-2">
            {units.map((unit, index) => (
              <Button
                key={unit.id}
                variant={selectedUnitIndex === index ? "default" : "outline"}
                className="justify-start h-auto p-3"
                onClick={() => setSelectedUnitIndex(index)}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {unit.bhk} BHK - {unit.unitNumber}
                  </div>
                  <div className="text-xs opacity-70">
                    {formatPrice(calculateCompletePricing({
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
                    }).breakdown.totalAmount)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Loan Percentage Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Loan Amount
            </label>
            <span className="text-sm text-gray-600">
              {loanPercentage[0]}% of property value
            </span>
          </div>
          <Slider
            value={loanPercentage}
            onValueChange={setLoanPercentage}
            max={90}
            min={50}
            step={5}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>50%</span>
            <span>90%</span>
          </div>
        </div>

        {/* Tenure Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Loan Tenure
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[15, 20, 25].map((tenure) => (
              <Button
                key={tenure}
                variant={selectedTenure === tenure ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTenure(tenure)}
              >
                {tenure} Years
              </Button>
            ))}
          </div>
        </div>

        {/* EMI Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Property Value</span>
            <span className="font-medium">{formatPrice(pricing.breakdown.totalAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Loan Amount ({loanPercentage[0]}%)</span>
            <span className="font-medium">{formatPrice(loanAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Down Payment</span>
            <span className="font-medium">{formatPrice(downPayment)}</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Monthly EMI</span>
              <span className="text-lg font-bold text-blue-600">
                {selectedEmi ? formatEmi(selectedEmi.monthlyEmi) : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-gray-500 text-right">
              for {selectedTenure} years @ 9% interest
            </div>
          </div>
        </div>

        {/* EMI Options */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">
            Compare EMI Options
          </div>
          <div className="space-y-2">
            {pricing.emiOptions.slice(0, 3).map((option, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded border ${
                  option.tenure === selectedTenure ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
              >
                <div>
                  <div className="text-sm font-medium">{option.tenure} Years</div>
                  <div className="text-xs text-gray-500">
                    Total Interest: {formatPrice(option.totalInterest)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatEmi(option.monthlyEmi)}</div>
                  <div className="text-xs text-gray-500">per month</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          * EMI calculations are approximate. Final rates may vary based on bank policies and your credit profile.
        </div>
      </CardContent>
    </Card>
  )
}
