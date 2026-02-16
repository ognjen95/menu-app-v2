'use client'

import { ReactNode } from 'react'
import { OfflineIndicator } from '@/components/providers/offline-auth-guard'

interface DashboardAuthWrapperProps {
  children: ReactNode
}

/**
 * Client-side wrapper for dashboard that shows offline indicator
 * Server-side layout handles authentication
 * This only adds UX feedback when user is offline
 */
export function DashboardAuthWrapper({ children }: DashboardAuthWrapperProps) {
  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  )
}
