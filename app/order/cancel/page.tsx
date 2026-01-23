'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function OrderCancelPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* Cancel icon */}
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>
            <p className="text-muted-foreground mb-6">
              Your payment was not completed. Don&apos;t worry, no charges were made.
            </p>

            {orderId && (
              <p className="text-sm text-muted-foreground mb-6">
                Order #{orderId.slice(-6).toUpperCase()} has been saved. 
                You can try again or choose a different payment method.
              </p>
            )}

            <div className="space-y-3">
              {orderId && (
                <Link href={`/checkout/${orderId}`}>
                  <Button className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
