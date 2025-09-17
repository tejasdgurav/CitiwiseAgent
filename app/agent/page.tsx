import { prisma } from '@/lib/db'
import { LeadSearch } from '@/components/agent/LeadSearch'
import { DealPageCreator } from '@/components/agent/DealPageCreator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { calculateCompletePricing } from '@/lib/pricing/engine'
import { RunPlannerButton } from '@/components/common/RunPlannerButton'

export default async function AgentConsolePage() {
  // Get recent leads and stats, available units, and first project (for planner)
  const [recentLeads, leadStats, todayTasks, availableUnits, project] = await Promise.all([
    prisma.lead.findMany({
      include: {
        contact: true,
        project: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    }),
    prisma.task.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    }),
    prisma.unit.findMany({
      where: { status: 'AVAILABLE' },
      include: { tower: true },
      take: 20,
    }),
    prisma.project.findFirst(),
  ])

  const totalLeads = leadStats.reduce((sum: number, stat: any) => sum + stat._count.status, 0)
  const qualifiedLeads = leadStats.find((s: any) => s.status === 'QUALIFIED')?._count.status || 0
  const convertedLeads = leadStats.find((s: any) => s.status === 'CONVERTED')?._count.status || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Agent Console</h1>
              <p className="text-sm text-gray-600">Search leads, create deals, and manage your pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp Sim
              </Button>
              {project && (
                <RunPlannerButton projectId={project.id} size="sm" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Qualified</p>
                  <p className="text-2xl font-bold text-gray-900">{qualifiedLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Converted</p>
                  <p className="text-2xl font-bold text-gray-900">{convertedLeads}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{todayTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lead Search */}
          <div className="lg:col-span-2">
            <LeadSearch leads={recentLeads} />
          </div>

          {/* Right Column - Deal Creator */}
          <div>
            <DealPageCreator
              leads={recentLeads
                .filter((l: any) => ['QUALIFIED', 'INTERESTED'].includes(l.status))
                .map((l: any) => ({
                  id: l.id,
                  name: l.contact.name || l.contact.phone,
                  phone: l.contact.phone,
                  status: l.status,
                }))}
              units={availableUnits.map((u: any) => {
                const pricing = calculateCompletePricing({
                  basePrice: u.basePrice,
                  carpetArea: u.carpetArea,
                  plcMap: { default: u.plc ? u.plc / u.carpetArea : 0 },
                  floorRise: u.floorRise ? u.floorRise / u.carpetArea : 0,
                  parking: u.parking || 0,
                  gstRate: 5,
                  stampDutyRate: 5,
                  registrationFee: 30000,
                })
                const lakhs = Math.round(pricing.breakdown.totalAmount / 100000)
                return {
                  id: u.id,
                  name: `${u.bhk} BHK - ${u.unitNumber}`,
                  priceLabel: `₹${lakhs}L`,
                  tower: u.tower.name,
                  status: u.status,
                }
              })}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Lead Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLeads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.contact.name || lead.contact.phone}
                        </div>
                        <div className="text-sm text-gray-600">
                          {lead.project.name} • {lead.source}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        lead.status === 'CONVERTED' ? 'default' :
                        lead.status === 'QUALIFIED' ? 'secondary' :
                        'outline'
                      }>
                        {lead.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(lead.updatedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
