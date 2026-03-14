import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

export type Language = {
  code: string
  name: string
  native_name: string
  flag_emoji: string
  is_rtl: boolean
  is_active: boolean
  is_public_active: boolean
}

export type TenantLanguage = {
  language_code: string
  is_enabled: boolean
  is_default: boolean
}

type AllLanguagesResponse = { data: { languages: Language[] } }
type TenantLanguagesResponse = { data: { languages: TenantLanguage[] } }
type TenantPublicLanguagesResponse = { data: { languages: (TenantLanguage & { language: Language })[] } }

// * Used for All available Websites and Menus which Tenant Can select
export function useAllActivePublicLanguages() {
  return useQuery({
    queryKey: ['all-public-languages'],
    queryFn: () => apiGet<AllLanguagesResponse>('/languages/all?is_public_active=true'),
    staleTime: 10 * 60 * 1000,
  })
}

// * Used for all available Landing Page and APP Dashboard languages
export function useAllActiveLanguages() {
  return useQuery({
    queryKey: ['all-languages'],
    queryFn: () => apiGet<AllLanguagesResponse>('/languages/all'),
    staleTime: 10 * 60 * 1000,
  })
}

// * Used for Tenant Websites and Menus 
export function useTenantLanguages() {
  return useQuery({
    queryKey: ['tenant-languages'],
    queryFn: () => apiGet<TenantLanguagesResponse>('/languages'),
  })
}

// * Used for Active Tenant Websites and Menus 
export function useActiveTenantLanguages() {
  return useQuery({
    queryKey: ['active-tenant-languages'],
    queryFn: () => apiGet<TenantLanguagesResponse>('/languages?is_active=true'),
  })
}

// * Used for Public Tenant Languages by Tenant ID
export function useTenantPublicLanguages(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-public-languages', tenantId],
    queryFn: () => apiGet<TenantPublicLanguagesResponse>(`/languages/public/${tenantId}`),
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000,
  })
}
