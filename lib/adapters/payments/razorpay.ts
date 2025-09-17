import type { PaymentAdapter, PaymentRequest, PaymentResponse, PaymentWebhookNormalized } from './types'
import { logger } from '@/lib/logging'

function getBasicAuth(keyId?: string, keySecret?: string) {
  const id = keyId || process.env.RAZORPAY_KEY_ID
  const secret = keySecret || process.env.RAZORPAY_KEY_SECRET
  if (!id || !secret) throw new Error('Missing Razorpay credentials')
  const token = Buffer.from(`${id}:${secret}`).toString('base64')
  return `Basic ${token}`
}

// Minimal Razorpay adapter using REST API
export class RazorpayAdapter implements PaymentAdapter {
  async createPaymentLink(req: PaymentRequest): Promise<PaymentResponse> {
    // Create an order
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(req.amount),
        currency: req.currency || 'INR',
        receipt: req.orderId,
        payment_capture: 1
      })
    })

    if (!orderRes.ok) {
      const text = await orderRes.text()
      logger.error('Razorpay order creation failed', { status: orderRes.status, text })
      throw new Error('Failed to create Razorpay order')
    }

    const order = await orderRes.json() as any

    // Create a payment link
    const linkRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': getBasicAuth(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(req.amount),
        currency: req.currency || 'INR',
        accept_partial: false,
        reference_id: req.orderId,
        customer: {
          name: req.customerName,
          email: req.customerEmail,
          contact: req.customerPhone,
        },
        notify: { sms: true, email: !!req.customerEmail },
        callback_url: req.callbackUrl,
        callback_method: 'get',
        description: req.description,
      })
    })

    if (!linkRes.ok) {
      const text = await linkRes.text()
      logger.error('Razorpay payment link creation failed', { status: linkRes.status, text })
      throw new Error('Failed to create Razorpay payment link')
    }

    const link = await linkRes.json() as any

    return {
      paymentId: order.id,
      paymentUrl: link.short_url || link.url,
      status: link.status || 'created',
      orderId: req.orderId,
    }
  }

  async normalizeWebhook(request: Request): Promise<PaymentWebhookNormalized | null> {
    try {
      const payload = await request.json() as any
      // Razorpay webhooks vary; try to map common events
      const entity = payload?.payload?.payment?.entity || payload?.payload?.order?.entity
      if (!entity) return null

      // Determine status
      let status: 'success' | 'failed' | 'pending' = 'pending'
      if (entity.status === 'captured' || entity.status === 'paid') status = 'success'
      else if (entity.status === 'failed') status = 'failed'

      // Find order/amount
      const orderId = entity.order_id || payload?.payload?.order?.entity?.id || payload?.payload?.payment?.entity?.order_id
      const amount = entity.amount || payload?.payload?.order?.entity?.amount

      return {
        paymentId: entity.id,
        orderId: orderId || 'unknown',
        status,
        amount: typeof amount === 'number' ? amount : Number(amount) || 0,
        currency: entity.currency || 'INR',
        transactionId: entity.id,
      }
    } catch (e) {
      logger.error('Razorpay normalizeWebhook failed', { error: e })
      return null
    }
  }
}
