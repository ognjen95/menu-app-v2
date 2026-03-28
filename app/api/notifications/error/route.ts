import { NextRequest, NextResponse } from 'next/server'
import { notifyApplicationError, isTelegramEnabled } from '@/features/notifications/telegram'

export async function POST(request: NextRequest) {
  // Only send in production (comment out for testing)
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ success: false, reason: 'Not in production' })
  }

  // Check if Telegram is configured
  if (!isTelegramEnabled()) {
    return NextResponse.json({ success: false, reason: 'Telegram not configured' })
  }

  try {
    const body = await request.json()

    const result = await notifyApplicationError({
      message: body.message || 'Unknown error',
      stack: body.stack,
      digest: body.digest,
      url: body.url || 'Unknown URL',
      userAgent: body.userAgent || 'Unknown',
      timestamp: new Date(),
      environment: 'production',
    })

    return NextResponse.json({ success: result.success })
  } catch (error) {
    console.error('[Error Notification] Failed to send:', error)
    return NextResponse.json({ success: false, reason: 'Internal error' })
  }
}
