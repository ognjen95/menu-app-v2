'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Loader2, Home, ArrowLeft } from 'lucide-react'

type OrderDetails = {
  id: string
  order_number: string
  status: string
  total: number
  currency: string
  items: {
    item_name: string
    quantity: number
    total_price: number
  }[]
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) {
        setError('No order ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/public/orders?order_id=${orderId}`)
        const result = await response.json()

        if (result.data?.order) {
          setOrder(result.data.order)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const currencySymbol = order?.currency === 'EUR' ? '€' : order?.currency || '€'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>
          ) : order ? (
            <div className="text-center">
              {/* Success icon */}
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your order. Your payment has been processed.
              </p>

              {/* Order number */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-2xl font-bold font-mono">
                  #{order.order_number || order.id.slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Order summary */}
              <div className="text-left border rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.item_name}</span>
                      <span>{currencySymbol}{item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total Paid</span>
                  <span>{currencySymbol}{order.total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Your order is being prepared. We&apos;ll notify you when it&apos;s ready!
              </p>

              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Menu
                </Button>
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
