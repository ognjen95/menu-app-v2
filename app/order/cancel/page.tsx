'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { XCircle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react'

function OrderCancelContent() {
  const t = useTranslations('orderCancel')
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

            <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('description')}
            </p>

            {orderId && (
              <p className="text-sm text-muted-foreground mb-6">
                {t('orderSaved', { orderId: orderId.slice(-6).toUpperCase() })}
              </p>
            )}

            <div className="space-y-3">
              {orderId && (
                <Link href={`/checkout/${orderId}`}>
                  <Button className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('tryAgain')}
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToMenu')}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrderCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <OrderCancelContent />
    </Suspense>
  )
}
