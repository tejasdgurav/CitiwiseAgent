'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Link, Send } from 'lucide-react'

interface LeadOption {
  id: string
  name: string
  phone: string
  status: string
}

interface UnitOption {
  id: string
  name: string
  priceLabel: string
  tower: string
  status: string
}

interface DealPageCreatorProps {
  leads: LeadOption[]
  units: UnitOption[]
}

export function DealPageCreator({ leads, units }: DealPageCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedLead, setSelectedLead] = useState('')
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [expiryDays, setExpiryDays] = useState(7)

  const handleCreateDealPage = async () => {
    if (!selectedLead || selectedUnits.length === 0) {
      alert('Please select a lead and at least one unit')
      return
    }

    setIsCreating(true)
    
    try {
      const response = await fetch('/api/agent/create-deal-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: selectedLead,
          unitIds: selectedUnits,
          expiryDays,
        }),
      })

      if (response.ok) {
        const { dealCode, dealUrl } = await response.json()
        
        // Show success message with options
        const action = confirm(
          `Deal page created successfully!\n\nDeal Code: ${dealCode}\n\nWould you like to:\n- OK: Open the deal page\n- Cancel: Copy link to clipboard`
        )
        
        if (action) {
          window.open(dealUrl, '_blank')
        } else {
          navigator.clipboard.writeText(dealUrl)
          alert('Deal page link copied to clipboard!')
        }
        
        // Reset form
        setSelectedLead('')
        setSelectedUnits([])
        setExpiryDays(7)
      } else {
        throw new Error('Failed to create deal page')
      }
    } catch (error) {
      console.error('Error creating deal page:', error)
      alert('Failed to create deal page. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const availableLeads = leads
  const availableUnits = units

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Deal Page</CardTitle>
        <p className="text-sm text-gray-600">
          Generate personalized deal pages for qualified leads
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Lead Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Lead
          </label>
          <select
            value={selectedLead}
            onChange={(e) => setSelectedLead(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a lead...</option>
            {availableLeads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} ({lead.phone}) - {lead.status}
              </option>
            ))}
          </select>
        </div>

        {/* Unit Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Units (Choose exactly 3)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableUnits.map((unit) => (
              <div
                key={unit.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedUnits.includes(unit.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (selectedUnits.includes(unit.id)) {
                    setSelectedUnits(selectedUnits.filter(id => id !== unit.id))
                  } else if (selectedUnits.length < 3) {
                    setSelectedUnits([...selectedUnits, unit.id])
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{unit.name}</div>
                    <div className="text-sm text-gray-600">{unit.tower}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{unit.priceLabel}</div>
                    <Badge variant="outline" className="text-xs">
                      {unit.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Selected: {selectedUnits.length}/3 units
          </div>
        </div>

        {/* Expiry Settings */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deal Expiry
          </label>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days (recommended)</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {selectedLead && selectedUnits.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">Preview</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Lead: {availableLeads.find(l => l.id === selectedLead)?.name}
              </div>
              <div>
                Units: {selectedUnits.length} selected
              </div>
              <div>
                Expires: {new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleCreateDealPage}
            disabled={!selectedLead || selectedUnits.length !== 3 || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Deal Page
              </>
            )}
          </Button>

          {selectedLead && selectedUnits.length === 3 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Link className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Send className="mr-1 h-3 w-3" />
                Send WhatsApp
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium text-gray-900 mb-2">Today's Activity</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-medium text-blue-900">5</div>
              <div className="text-blue-700">Deal Pages Created</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-medium text-green-900">2</div>
              <div className="text-green-700">Tokens Received</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
