import { PaymentAdapter } from './types'
import { PaymentStubAdapter } from './stub'
import { RazorpayAdapter } from './razorpay'

export function getPaymentAdapter(): PaymentAdapter {
  const provider = (process.env.PAYMENTS_PROVIDER || 'stub').toLowerCase()
  switch (provider) {
    case 'razorpay':
      return new RazorpayAdapter()
    case 'stub':
    default:
      return new PaymentStubAdapter(process.env.NEXTAUTH_URL || 'http://localhost:3000')
  }
}
