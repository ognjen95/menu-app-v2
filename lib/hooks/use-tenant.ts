'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api'
import type { Tenant, TenantUser, Location, TenantRole } from '@/lib/types'

// Query keys
export const tenantKeys = {
  all: ['tenant'] as const,
  current: () => [...tenantKeys.all, 'current'] as const,
  users: () => [...tenantKeys.all, 'users'] as const,
  locations: () => [...tenantKeys.all, 'locations'] as const,
  location: (id: string) => [...tenantKeys.locations(), id] as const,
}

// Types
type CurrentTenantResponse = {
  tenant: Tenant
  user: TenantUser
  locations: Location[]
}

type TenantUsersResponse = {
  users: (TenantUser & { email: string; name: string })[]
}

type InviteUserInput = {
  email: string
  role: TenantRole
}

// Hooks
export function useCurrentTenant() {
  return useQuery({
    queryKey: tenantKeys.current(),
    queryFn: () => apiGet<{data: CurrentTenantResponse}>('/tenant/current'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useTenantUsers() {
  return useQuery({
    queryKey: tenantKeys.users(),
    queryFn: () => apiGet<TenantUsersResponse>('/tenant/users'),
  })
}

export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteUserInput) => 
      apiPost<{ user: TenantUser }>('/tenant/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.users() })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: TenantRole }) =>
      apiPut<{ user: TenantUser }>(`/tenant/users/${userId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.users() })
    },
  })
}

export function useRemoveUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => apiDelete<{ success: boolean }>(`/tenant/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.users() })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Tenant>) => apiPut<{ tenant: Tenant }>('/tenant/current', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.current() })
    },
  })
}

export function useLocations() {
  return useQuery({
    queryKey: tenantKeys.locations(),
    queryFn: () => apiGet<{ data:{locations: Location[] } }>('/locations'),
  })
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: tenantKeys.location(id),
    queryFn: () => apiGet<{ location: Location }>(`/locations/${id}`),
    enabled: !!id,
  })
}

export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Location>) => 
      apiPost<{ location: Location }>('/locations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.locations() })
    },
  })
}

export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Location> & { id: string }) =>
      apiPatch<{ location: Location }>(`/locations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.locations() })
      queryClient.invalidateQueries({ queryKey: tenantKeys.location(variables.id) })
    },
  })
}

export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiDelete<{ success: boolean }>(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.locations() })
    },
  })
}
