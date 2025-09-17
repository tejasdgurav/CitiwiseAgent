import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { rateLimit } from '@/lib/rateLimit'
import { getPaymentAdapter } from '@/lib/adapters/payments'
import type { PaymentWebhookNormalized } from '@/lib/adapters/payments/types'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const key = `rl:payments:${ip}`
    const { allowed, remaining, resetAt } = rateLimit({ key, windowMs: 10_000, max: 20 })
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    // Normalize provider webhook
    const adapter = getPaymentAdapter()
    const normalized = await adapter.normalizeWebhook(request)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
    logger.info('Payment webhook received (normalized)', { normalized })

    // Process payment webhook
    await processPaymentWebhook(normalized)

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    logger.error('Payment webhook error', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function processPaymentWebhook(payload: PaymentWebhookNormalized) {
  const { paymentId, orderId, status, amount, transactionId } = payload

  // Find the token by order ID pattern
  const orderIdParts = orderId.split('_')
  if (orderIdParts[0] !== 'token') {
    logger.warn('Invalid order ID format', { orderId })
    return
  }

  const dealPageId = orderIdParts[1]
  const unitId = orderIdParts[2]

  const token = await prisma.token.findFirst({
    where: {
      dealPageId,
      amount,
    },
    include: {
      dealPage: {
        include: {
          lead: {
            include: {
              contact: true,
            },
          },
        },
      },
      offer: {
        include: {
          unit: {
            include: {
              tower: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!token) {
    logger.warn('Token not found for payment webhook', { orderId, paymentId })
    return
  }

  // Update token status based on payment status
  let tokenStatus: 'CREATED' | 'PAID' | 'FAILED' | 'EXPIRED'
  
  switch (status) {
    case 'success':
      tokenStatus = 'PAID'
      break
    case 'failed':
      tokenStatus = 'FAILED'
      break
    default:
      tokenStatus = 'CREATED'
  }

  await prisma.token.update({
    where: { id: token.id },
    data: { status: tokenStatus },
  })

  if (status === 'success') {
    // Update unit status to HOLD
    await prisma.unit.update({
      where: { id: token.offer.unit.id },
      data: { status: 'HOLD' },
    })

    // Update lead status to CONVERTED
    await prisma.lead.update({
      where: { id: token.dealPage.leadId },
      data: { status: 'CONVERTED' },
    })

    // Create receipt record
    await prisma.receipt.create({
      data: {
        leadId: token.dealPage.leadId,
        amount,
        paymentMethod: 'online',
        referenceId: transactionId || paymentId,
      },
    })

    logger.info('Token payment successful - unit placed on hold', {
      tokenId: token.id,
      unitId: token.offer.unit.id,
      leadId: token.dealPage.leadId,
      amount,
    })
  }

  // Log the event
  await prisma.event.create({
    data: {
      name: `token_payment_${status}`,
      payload: {
        tokenId: token.id,
        paymentId,
        orderId,
        amount,
        transactionId,
        unitId: token.offer.unit.id,
        leadId: token.dealPage.leadId,
      },
    },
  })
}
