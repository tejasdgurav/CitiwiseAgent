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

export interface PaymentWebhookNormalized {
  paymentId: string
  orderId: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  transactionId?: string
}

export interface PaymentAdapter {
  createPaymentLink(request: PaymentRequest): Promise<PaymentResponse>
  normalizeWebhook(request: Request): Promise<PaymentWebhookNormalized | null>
}
