'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, CreditCard, Loader2 } from 'lucide-react'

interface PaymentStubPageProps {
  paymentId: string
  amount: number
  orderId: string
}

export function PaymentStubPage({ paymentId, amount, orderId }: PaymentStubPageProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null)

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const simulatePayment = async (success: boolean) => {
    setIsProcessing(true)
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const status = success ? 'success' : 'failed'
    setPaymentResult(status)
    
    // Send webhook to our backend
    try {
      const webhookPayload = {
        paymentId,
        orderId,
        status,
        amount,
        currency: 'INR',
        transactionId: success ? `txn_${Date.now()}` : undefined,
        failureReason: success ? undefined : 'Payment declined by bank',
        timestamp: new Date().toISOString(),
      }

      await fetch('/api/webhooks/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      })
    } catch (error) {
      console.error('Webhook error:', error)
    }
    
    setIsProcessing(false)
    
    // Redirect after 3 seconds
    setTimeout(() => {
      if (success) {
        window.location.href = `/payments/success?paymentId=${paymentId}`
      } else {
        window.location.href = `/payments/failed?paymentId=${paymentId}`
      }
    }, 3000)
  }

  if (paymentResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            {paymentResult === 'success' ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 mb-4">
                  Your token payment of {formatAmount(amount)} has been processed successfully.
                </p>
                <div className="text-sm text-gray-500">
                  Transaction ID: txn_{Date.now()}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-600 mb-4">
                  Your payment could not be processed. Please try again.
                </p>
                <div className="text-sm text-gray-500">
                  Reason: Payment declined by bank
                </div>
              </>
            )}
            <div className="mt-4 text-sm text-gray-500">
              Redirecting in 3 seconds...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your payment of {formatAmount(amount)}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Payment Gateway (Stub)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatAmount(amount)}
            </div>
            <div className="text-sm text-gray-600">
              Payment ID: {paymentId}
            </div>
            <div className="text-sm text-gray-600">
              Order ID: {orderId}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Demo Payment Gateway</span>
            </div>
            <p className="text-yellow-700 text-xs mt-1">
              This is a stub payment gateway for testing. Choose success or failure to simulate the payment flow.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => simulatePayment(true)}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Simulate Success
            </Button>
            
            <Button
              onClick={() => simulatePayment(false)}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Simulate Failure
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            In production, this would be replaced with actual payment gateway integration (Razorpay, Cashfree, etc.)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
