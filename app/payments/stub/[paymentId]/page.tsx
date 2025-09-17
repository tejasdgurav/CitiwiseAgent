import { notFound } from 'next/navigation'
import { PaymentStubPage } from '@/components/payments/PaymentStubPage'

interface PaymentStubPageProps {
  params: {
    paymentId: string
  }
  searchParams: {
    amount?: string
    orderId?: string
  }
}

export default function PaymentStub({ params, searchParams }: PaymentStubPageProps) {
  const { paymentId } = params
  const { amount, orderId } = searchParams

  if (!paymentId || !amount || !orderId) {
    notFound()
  }

  return (
    <PaymentStubPage
      paymentId={paymentId}
      amount={parseInt(amount)}
      orderId={orderId}
    />
  )
}
