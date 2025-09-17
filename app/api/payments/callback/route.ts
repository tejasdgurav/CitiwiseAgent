import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'

// Handles payment link callback flows (e.g., Razorpay Payment Links)
// We do not rely solely on this for state changes; webhooks will finalize status.
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('razorpay_payment_link_status')
    const referenceId = url.searchParams.get('razorpay_payment_link_reference_id') || url.searchParams.get('orderId')

    // referenceId is our orderId; format: token_<dealPageId>_<unitId>_<ts>
    let redirectUrl = '/'
    if (referenceId && referenceId.startsWith('token_')) {
      const parts = referenceId.split('_')
      const dealPageId = parts[1]
      const dealPage = await prisma.dealPage.findUnique({ where: { id: dealPageId } })
      if (dealPage) {
        const code = dealPage.linkCode
        if (status === 'paid' || status === 'captured' || status === 'success') {
          redirectUrl = `/deal/${code}?paid=true`
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          redirectUrl = `/deal/${code}?cancelled=true`
        } else {
          redirectUrl = `/deal/${code}`
        }
      }
    }

    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  } catch (error) {
    logger.error('Payment callback error', { error })
    return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
  }
}
