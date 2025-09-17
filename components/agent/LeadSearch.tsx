'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Phone, Mail, MessageSquare, Eye, Plus } from 'lucide-react'

interface Lead {
  id: string
  status: string
  source: string
  notes?: string | null
  createdAt: Date
  updatedAt: Date
  contact: {
    id: string
    phone: string
    name?: string | null
    email?: string | null
  }
  project: {
    id: string
    name: string
    city: string
  }
}

interface LeadSearchProps {
  leads: Lead[]
}

export function LeadSearch({ leads }: LeadSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.contact.phone.includes(searchQuery) ||
      lead.contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedStatus === 'ALL' || lead.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONVERTED': return 'bg-green-100 text-green-800'
      case 'QUALIFIED': return 'bg-blue-100 text-blue-800'
      case 'INTERESTED': return 'bg-yellow-100 text-yellow-800'
      case 'NEW': return 'bg-gray-100 text-gray-800'
      case 'LOST': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateDealPage = async (leadId: string) => {
    try {
      const response = await fetch('/api/agent/create-deal-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      })

      if (response.ok) {
        const { dealCode } = await response.json()
        window.open(`/deal/${dealCode}`, '_blank')
      } else {
        throw new Error('Failed to create deal page')
      }
    } catch (error) {
      console.error('Error creating deal page:', error)
      alert('Failed to create deal page. Please try again.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lead Search & Management</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone, name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="INTERESTED">Interested</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No leads found</p>
              <p className="text-xs text-gray-400">Try adjusting your search criteria</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {lead.contact.name || 'Unknown Contact'}
                      </h3>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{lead.contact.phone}</span>
                      </div>
                      {lead.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{lead.contact.email}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {lead.project.name}, {lead.project.city} • Source: {lead.source}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-right">
                    <div>Updated</div>
                    <div>{new Date(lead.updatedAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    <strong>Notes:</strong> {lead.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      WhatsApp
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-1 h-3 w-3" />
                      Timeline
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {lead.status === 'QUALIFIED' && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateDealPage(lead.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Create Deal
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} leads
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
