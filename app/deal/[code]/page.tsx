import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { calculateCompletePricing } from '@/lib/pricing/engine'
import { UnitCard } from '@/components/deal/UnitCard'
import { EmiBlock } from '@/components/deal/EmiBlock'
import { TokenButton } from '@/components/deal/TokenButton'
import { ShareButton } from '@/components/deal/ShareButton'

interface DealPageProps {
  params: { code: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function DealPage({ params, searchParams }: DealPageProps) {
  const dealPage = await prisma.dealPage.findUnique({
    where: { linkCode: params.code },
    include: {
      lead: {
        include: {
          contact: true,
          project: true,
        },
      },
      units: {
        include: {
          tower: {
            include: { project: true },
          },
        },
      },
    },
  })

  if (!dealPage) {
    notFound()
  }

  // Check if deal page has expired
  if (new Date() > dealPage.expiresAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Deal Expired</h1>
          <p className="text-gray-600 mb-4">
            This deal link has expired. Please contact our sales team for updated offers.
          </p>
          <a
            href="tel:+919876543210"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Call Sales Team
          </a>
        </div>
      </div>
    )
  }

  // Units are directly related on the deal page
  const units = dealPage.units

  if (!units || units.length === 0) {
    notFound()
  }

  const project = units[0].tower.project
  const customerName = dealPage.lead.contact.name || 'Valued Customer'

  const paid = typeof searchParams?.paid === 'string' ? searchParams?.paid : undefined
  const cancelled = typeof searchParams?.cancelled === 'string' ? searchParams?.cancelled : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-600">{project.city}</p>
            </div>
            <ShareButton dealCode={params.code} />
          </div>
        </div>
      </div>

      {/* Status Banners */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        {paid && (
          <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-800 text-sm">
            Thank you! Your token payment was recorded successfully.
          </div>
        )}
        {cancelled && (
          <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
            Payment cancelled. You can try again below or contact our team for help.
          </div>
        )}
      </div>

      {/* Welcome Message */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-blue-900 mb-1">
            Hello {customerName}! 👋
          </h2>
          <p className="text-blue-700 text-sm">
            We've curated these exclusive units just for you. Offer expires on{' '}
            <span className="font-medium">
              {dealPage.expiresAt.toLocaleDateString('en-IN')}
            </span>
          </p>
        </div>

        {/* Units Grid */}
        <div className="space-y-6 mb-8">
          {units.map((unit, index) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              isRecommended={index === 0}
              dealCode={params.code}
            />
          ))}
        </div>

        {/* EMI Calculator */}
        <div className="mb-8">
          <EmiBlock units={units} />
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Book Your Dream Home?
            </h3>
            <p className="text-gray-600 text-sm">
              Secure your unit with a token amount. Limited time offer!
            </p>
          </div>

          <div className="space-y-4">
            {units.map((unit) => (
              <TokenButton
                key={unit.id}
                unit={unit}
                dealCode={params.code}
                customerName={customerName}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Need help? Call us at{' '}
            <a href="tel:+919876543210" className="text-blue-600 hover:underline">
              +91 98765 43210
            </a>
          </p>
          <p className="mt-1">
            This is a personalized offer valid until {dealPage.expiresAt.toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  )
}
