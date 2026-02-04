'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut } from '@/lib/api'
import type { TenantLanguage, Translation } from '@/lib/types'

// Query keys
export const translationKeys = {
  all: ['translations'] as const,
  languages: () => [...translationKeys.all, 'languages'] as const,
  byKey: (key: string) => [...translationKeys.all, 'key', key] as const,
  byPrefix: (prefix: string) => [...translationKeys.all, 'prefix', prefix] as const,
}

// Types for API responses
type LanguagesResponse = { data: { languages: TenantLanguage[] } }
type TranslationsResponse = { data: { translations: Translation[] } }
type TranslationResponse = { data: { translation: Translation } }

// Fetch tenant's enabled languages
export function useTenantLanguages() {
  return useQuery({
    queryKey: translationKeys.languages(),
    queryFn: () => apiGet<LanguagesResponse>('/languages'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Fetch translations by key
export function useTranslations(key: string) {
  return useQuery({
    queryKey: translationKeys.byKey(key),
    queryFn: () => apiGet<TranslationsResponse>('/translations', { key }),
    enabled: !!key,
  })
}

// Fetch translations by key prefix
export function useTranslationsByPrefix(prefix: string) {
  return useQuery({
    queryKey: translationKeys.byPrefix(prefix),
    queryFn: () => apiGet<TranslationsResponse>('/translations', { key_prefix: prefix }),
    enabled: !!prefix,
  })
}

// Save a single translation
export function useSaveTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { key: string; language_code: string; value: string }) =>
      apiPost<TranslationResponse>('/translations', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: translationKeys.byKey(variables.key) })
      // Also invalidate prefix queries that might include this key
      const keyParts = variables.key.split('.')
      if (keyParts.length > 1) {
        queryClient.invalidateQueries({ queryKey: translationKeys.byPrefix(keyParts.slice(0, -1).join('.')) })
      }
    },
  })
}

// Bulk save translations
export function useSaveTranslations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (translations: { key: string; language_code: string; value: string }[]) =>
      apiPut<TranslationsResponse>('/translations', { translations }),
    onSuccess: () => {
      // Invalidate all translation queries since we might have updated multiple keys
      queryClient.invalidateQueries({ queryKey: translationKeys.all })
    },
  })
}

// Enable/disable a language for tenant
export function useToggleLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { language_code: string; is_enabled: boolean; is_default?: boolean }) =>
      apiPost<{ data: { language: TenantLanguage } }>('/languages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: translationKeys.languages() })
    },
  })
}

// Helper to get translation value from array by language code
export function getTranslation(
  translations: Translation[] | undefined,
  languageCode: string,
  fallback?: string
): string {
  const translation = translations?.find(t => t.language_code === languageCode)
  return translation?.value || fallback || ''
}

// Helper to generate translation key for menu items
export function generateItemTranslationKey(itemId: string, field: 'name' | 'description'): string {
  return `menu_item.${itemId}.${field}`
}

// Helper to generate translation key for categories
export function generateCategoryTranslationKey(categoryId: string, field: 'name' | 'description'): string {
  return `category.${categoryId}.${field}`
}

// Helper to generate translation key for menus
export function generateMenuTranslationKey(menuId: string, field: 'name' | 'description'): string {
  return `menu.${menuId}.${field}`
}

// Helper to generate translation key for website blocks
export function generateBlockTranslationKey(blockId: string, field: string): string {
  return `website_block.${blockId}.${field}`
}

// Helper to generate translation key prefix for website blocks
export function getBlockTranslationPrefix(blockId: string): string {
  return `website_block.${blockId}.`
}

// Helper to generate translation key for website pages
export function generatePageTranslationKey(pageId: string, field: 'title'): string {
  return `website_page.${pageId}.${field}`
}

// Helper to generate translation key prefix for website pages
export function getPageTranslationPrefix(pageId: string): string {
  return `website_page.${pageId}.`
}

// Helper to generate translation key for variant categories
export function generateVariantCategoryTranslationKey(categoryId: string, field: 'name' | 'description'): string {
  return `variant_category.${categoryId}.${field}`
}

// Helper to generate translation key prefix for variant categories
export function getVariantCategoryTranslationPrefix(categoryId: string): string {
  return `variant_category.${categoryId}.`
}

// Helper to generate translation key for menu item variants
export function generateMenuItemVariantTranslationKey(variantId: string, field: 'name'): string {
  return `menu_item_variant.${variantId}.${field}`
}

// Helper to generate translation key prefix for menu item variants
export function getMenuItemVariantTranslationPrefix(variantId: string): string {
  return `menu_item_variant.${variantId}.`
}
