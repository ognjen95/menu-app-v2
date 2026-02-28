'use client'

import { ReactNode } from 'react'
import { OfflineIndicator } from '@/components/providers/offline-auth-guard'
import { TenantProvider } from '@/lib/contexts/tenant-context'

interface DashboardAuthWrapperProps {
  children: ReactNode
}

/**
 * Client-side wrapper for dashboard that:
 * - Provides TenantContext for global tenant/user data access
 * - Shows offline indicator when user is offline
 * Server-side layout handles authentication
 */
export function DashboardAuthWrapper({ children }: DashboardAuthWrapperProps) {
  return (
    <TenantProvider>
      <OfflineIndicator />
      {children}
    </TenantProvider>
  )
}
