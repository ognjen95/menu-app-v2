'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Languages, Star, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Language, TenantLanguage } from '@/lib/types'

type AllLanguagesResponse = { data: { languages: Language[] } }
type TenantLanguagesResponse = { data: { languages: TenantLanguage[] } }

export default function LanguageSettingsPage() {
  const t = useTranslations('languagesPage')
  const queryClient = useQueryClient()

  // Fetch all available languages
  const { data: allLangsData, isLoading: allLangsLoading } = useQuery({
    queryKey: ['all-languages'],
    queryFn: () => apiGet<AllLanguagesResponse>('/languages/all'),
    staleTime: 10 * 60 * 1000,
  })

  // Fetch tenant's enabled languages
  const { data: tenantLangsData, isLoading: tenantLangsLoading } = useQuery({
    queryKey: ['tenant-languages'],
    queryFn: () => apiGet<TenantLanguagesResponse>('/languages'),
  })

  const toggleLanguageMutation = useMutation({
    mutationFn: (data: { language_code: string; is_enabled: boolean; is_default?: boolean }) =>
      apiPost('/languages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-languages'] })
      toast.success(t('languageUpdated'))
    },
    onError: (error: any) => {
      toast.error(t('updateFailed'), {
        description: error?.response?.data?.error || error?.message
      })
    }
  })

  // ! REMOVE THIS HARD CODED LANGUAGE LIMITATION WHEN YOU ADD ALL NEW LANGUAGES JSON FILES AND TRANSLATIONS
  const ONLY_THIS_LANGUAGES = ['sr', 'en', 'es']
  
  const allLanguages = allLangsData?.data?.languages.filter(lang => ONLY_THIS_LANGUAGES.includes(lang.code)) || []
  const tenantLanguages = tenantLangsData?.data?.languages || []

  // Create a map of enabled languages
  const enabledMap = new Map(tenantLanguages.map(tl => [tl.language_code, tl]))
  const defaultLang = tenantLanguages.find(tl => tl.is_default)

  const handleToggleLanguage = (langCode: string, enabled: boolean) => {
    toggleLanguageMutation.mutate({ language_code: langCode, is_enabled: enabled })
  }

  const handleSetDefault = (langCode: string) => {
    toggleLanguageMutation.mutate({ language_code: langCode, is_enabled: true, is_default: true })
  }

  const isLoading = allLangsLoading || tenantLangsLoading

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('howItWorks')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>{t('howItWorksDesc1')}</p>
          <p>{t('howItWorksDesc2')}</p>
        </CardContent>
      </Card>

      {/* Languages grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allLanguages.map((lang) => {
            const isEnabled = enabledMap.has(lang.code)
            const isDefault = defaultLang?.language_code === lang.code

            return (
              <Card
                key={lang.code}
                className={cn(
                  'transition-all',
                  isEnabled && 'border-primary/50 bg-primary/5'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">{lang.flag_emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{lang.native_name}</span>
                          {isDefault && (
                            <Badge variant="default" className="shrink-0 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {t('default')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{lang.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isEnabled && !isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(lang.code)}
                          disabled={toggleLanguageMutation.isPending}
                          title={t('setAsDefault')}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggleLanguage(lang.code, checked)}
                        disabled={toggleLanguageMutation.isPending || isDefault}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
