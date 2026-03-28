'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter()
  const notificationSent = useRef(false)

  useEffect(() => {
    console.error('Application error:', error)

    // Send Telegram notification in production (only once)
    if (process.env.NODE_ENV === 'production' && !notificationSent.current) {
      notificationSent.current = true
      
      fetch('/api/notifications/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        }),
      }).catch((err) => {
        console.error('Failed to send error notification:', err)
      })
    }
  }, [error])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try again or return to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={reset} variant="outline" className="w-full">
            Try again
          </Button>
          <Button onClick={handleGoToDashboard} className="w-full">
            Go to Dashboard
          </Button>
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="mt-4 text-xs text-muted-foreground bg-muted p-3 rounded-md font-mono break-all">
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
