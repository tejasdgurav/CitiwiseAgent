import { logger } from '@/lib/logging'

export interface PaymentRequest {
  amount: number
  currency: string
  orderId: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  description: string
  callbackUrl: string
  cancelUrl: string
}

export interface PaymentResponse {
  paymentId: string
  paymentUrl: string
  status: string
  orderId: string
}

export interface PaymentWebhookPayload {
  paymentId: string
  orderId: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  transactionId?: string
  failureReason?: string
  timestamp: string
}

export class PaymentStubAdapter {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  async createPaymentLink(request: PaymentRequest): Promise<PaymentResponse> {
    logger.info('Payment Stub: Creating payment link', { request })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // In stub mode, create a mock payment URL that will redirect to our success/failure pages
    const paymentUrl = `${this.baseUrl}/payments/stub/${paymentId}?amount=${request.amount}&orderId=${request.orderId}`
    
    logger.info('Payment Link Created', {
      paymentId,
      orderId: request.orderId,
      amount: request.amount,
      paymentUrl,
    })

    return {
      paymentId,
      paymentUrl,
      status: 'created',
      orderId: request.orderId,
    }
  }

  async getPaymentStatus(paymentId: string): Promise<{ status: string; transactionId?: string }> {
    logger.info('Payment Stub: Getting payment status', { paymentId })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // In stub mode, randomly return success/pending for demo
    const statuses = ['success', 'pending', 'failed']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    return {
      status: randomStatus,
      transactionId: randomStatus === 'success' ? `txn_${Date.now()}` : undefined,
    }
  }

  // Generate webhook payload for testing
  generateWebhookPayload(
    paymentId: string,
    orderId: string,
    status: 'success' | 'failed' | 'pending',
    amount: number
  ): PaymentWebhookPayload {
    return {
      paymentId,
      orderId,
      status,
      amount,
      currency: 'INR',
      transactionId: status === 'success' ? `txn_${Date.now()}` : undefined,
      failureReason: status === 'failed' ? 'Insufficient funds' : undefined,
      timestamp: new Date().toISOString(),
    }
  }
}

// Payment gateway configuration
export const PaymentConfig = {
  RAZORPAY: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },
  CASHFREE: {
    appId: process.env.CASHFREE_APP_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
  },
} as const
