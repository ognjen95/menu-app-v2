'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useCurrentTenant } from '@/lib/hooks/use-tenant'
import type { Tenant, TenantUser, Location, TenantRole } from '@/lib/types'

type TenantContextValue = {
  tenant: Tenant | null
  user: TenantUser | null
  locations: Location[]
  role: TenantRole | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

const TenantContext = createContext<TenantContextValue | null>(null)

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const { data, isLoading, isError, refetch } = useCurrentTenant()

  const value: TenantContextValue = {
    tenant: data?.data?.tenant ?? null,
    user: data?.data?.user ?? null,
    locations: data?.data?.locations ?? [],
    role: data?.data?.user?.role ?? null,
    isLoading,
    isError,
    refetch,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext)
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  
  return context
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext)
}
