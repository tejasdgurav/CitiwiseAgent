import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPaymentAdapter } from '@/lib/adapters/payments'
import { logger } from '@/lib/logging'

export async function POST(request: NextRequest) {
  try {
    const { dealCode, unitId, amount, customerName } = await request.json()

    // Validate input
    if (!dealCode || !unitId || !amount || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get deal page and validate
    const dealPage = await prisma.dealPage.findUnique({
      where: { linkCode: dealCode },
      include: {
        lead: {
          include: {
            contact: true,
          },
        },
      },
    })

    if (!dealPage) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      )
    }

    // Check if deal has expired
    if (new Date() > dealPage.expiresAt) {
      return NextResponse.json(
        { error: 'Deal has expired' },
        { status: 400 }
      )
    }

    // Get unit details
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        tower: {
          include: {
            project: true,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // Create offer record
    const offer = await prisma.offer.create({
      data: {
        dealPageId: dealPage.id,
        unitId: unit.id,
        priceBreakup: {
          basePrice: unit.basePrice,
          totalAmount: amount,
        },
        taxes: {},
        total: amount,
      },
    })

    // Generate order ID
    const orderId = `token_${dealPage.id}_${unit.id}_${Date.now()}`

    // Create token record
    const token = await prisma.token.create({
      data: {
        dealPageId: dealPage.id,
        offerId: offer.id,
        amount,
        status: 'CREATED',
      },
    })

    // Create payment link using selected provider adapter
    const paymentAdapter = getPaymentAdapter()
    const paymentResponse = await paymentAdapter.createPaymentLink({
      amount,
      currency: 'INR',
      orderId,
      customerName,
      customerEmail: dealPage.lead.contact.email || undefined,
      customerPhone: dealPage.lead.contact.phone,
      description: `Token payment for ${unit.bhk} BHK - ${unit.unitNumber}, ${unit.tower.project.name}`,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payments/callback`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/deal/${dealCode}?cancelled=true`,
    })

    // Update token with payment link
    await prisma.token.update({
      where: { id: token.id },
      data: {
        paymentLink: paymentResponse.paymentUrl,
      },
    })

    // Log the event
    await prisma.event.create({
      data: {
        name: 'token_payment_initiated',
        payload: {
          tokenId: token.id,
          dealCode,
          unitId,
          amount,
          paymentId: paymentResponse.paymentId,
        },
      },
    })

    logger.info('Token payment link created', {
      tokenId: token.id,
      paymentId: paymentResponse.paymentId,
      amount,
      unitId,
    })

    return NextResponse.json({
      paymentUrl: paymentResponse.paymentUrl,
      tokenId: token.id,
      paymentId: paymentResponse.paymentId,
    })
  } catch (error) {
    logger.error('Token payment creation failed', { error })
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
