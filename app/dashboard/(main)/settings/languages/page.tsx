'use client'

import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Languages, Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { LanguagesGridSkeleton } from '@/components/ui/skeletons'
import { useAllActivePublicLanguages, useTenantLanguages } from '@/features/translations'

export default function LanguageSettingsPage() {
  const t = useTranslations('languagesPage')
  const queryClient = useQueryClient()

  // Fetch all available languages
  const { data: allLangsData, isLoading: allLangsLoading } = useAllActivePublicLanguages()

  // Fetch tenant's enabled languages
  const { data: tenantLangsData, isLoading: tenantLangsLoading } = useTenantLanguages()

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

  const allLanguages = allLangsData?.data?.languages;
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
      <motion.div
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </motion.div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
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
      </motion.div>

      {/* Languages grid */}
      {isLoading ? (
        <LanguagesGridSkeleton count={6} />
      ) : (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {allLanguages?.map((lang, index) => {
            const tenantLang = enabledMap.get(lang.code)
            const isEnabled = tenantLang?.is_enabled ?? false
            const isDefault = defaultLang?.language_code === lang.code

            return (
              <motion.div key={lang.code} variants={staggerItemScale} custom={index}>
                <Card
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
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
