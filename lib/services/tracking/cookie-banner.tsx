'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useTracking } from './tracking-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Cookie, Settings, X } from 'lucide-react'

// =============================================================================
// Cookie Banner Component
// =============================================================================

interface CookieBannerProps {
  privacyPolicyUrl?: string
  position?: 'bottom' | 'bottom-left' | 'bottom-right'
  showSettingsButton?: boolean
}

export function CookieBanner({
  privacyPolicyUrl = '/privacy-policy',
  position = 'bottom',
  showSettingsButton = true,
}: CookieBannerProps) {
  const t = useTranslations('common.cookies')
  const { consent, hasConsent, acceptAll, rejectAll, updateConsent } = useTracking()
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [localConsent, setLocalConsent] = useState({
    analytics: consent.analytics,
    marketing: consent.marketing,
  })

  // Wait for client-side hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null
  }

  // Don't show if consent already given
  if (hasConsent !== null) {
    return null
  }

  const positionClasses = {
    bottom: 'bottom-0 left-0 right-0',
    'bottom-left': 'bottom-4 left-4 max-w-md',
    'bottom-right': 'bottom-4 right-4 max-w-md',
  }

  const handleSavePreferences = () => {
    updateConsent(localConsent)
    setShowSettings(false)
  }

  // Settings Panel
  if (showSettings) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50 p-4`}>
        <Card className="w-full max-w-lg shadow-lg border-border bg-background">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{t('preferences.title')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {t('preferences.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{t('necessary.title')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('necessary.description')}
                </p>
              </div>
              <Switch checked disabled className="opacity-50" />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="text-sm font-medium">
                  {t('analytics.title')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('analytics.description')}
                </p>
              </div>
              <Switch
                id="analytics"
                checked={localConsent.analytics}
                onCheckedChange={(checked) =>
                  setLocalConsent((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="text-sm font-medium">
                  {t('marketing.title')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('marketing.description')}
                </p>
              </div>
              <Switch
                id="marketing"
                checked={localConsent.marketing}
                onCheckedChange={(checked) =>
                  setLocalConsent((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={rejectAll}>
                {t('rejectAll')}
              </Button>
              <Button className="flex-1" onClick={handleSavePreferences}>
                {t('savePreferences')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Banner
  return (
    <div className={`fixed ${positionClasses[position]} z-50 p-4`}>
      <Card className="w-full shadow-lg border-border bg-background">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('title')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('description')}{' '}
                  <a
                    href={privacyPolicyUrl}
                    className="underline hover:text-foreground transition-colors"
                  >
                    {t('learnMore')}
                  </a>
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {showSettingsButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="justify-start sm:justify-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t('settings')}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={rejectAll}>
                  {t('reject')}
                </Button>
                <Button size="sm" onClick={acceptAll}>
                  {t('acceptAll')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Minimal Banner (Just accept/reject)
// =============================================================================

interface MinimalCookieBannerProps {
  privacyPolicyUrl?: string
}

export function MinimalCookieBanner({
  privacyPolicyUrl = '/privacy-policy',
}: MinimalCookieBannerProps) {
  const t = useTranslations('common.cookies')
  const { hasConsent, acceptAll, rejectAll } = useTracking()
  const [mounted, setMounted] = useState(false)

  // Wait for client-side hydration to prevent mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null
  }

  if (hasConsent !== null) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border">
      <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('minimalDescription')}{' '}
          <a href={privacyPolicyUrl} className="underline hover:text-foreground">
            {t('privacyPolicy')}
          </a>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={rejectAll}>
            {t('reject')}
          </Button>
          <Button size="sm" onClick={acceptAll}>
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Cookie Settings Button (for footer/settings page)
// =============================================================================

interface CookieSettingsButtonProps {
  variant?: 'link' | 'button'
  className?: string
}

export function CookieSettingsButton({
  variant = 'link',
  className,
}: CookieSettingsButtonProps) {
  const t = useTranslations('common.cookies')
  const { resetConsent } = useTracking()

  if (variant === 'link') {
    return (
      <button
        onClick={resetConsent}
        className={`text-sm text-muted-foreground hover:text-foreground underline transition-colors ${className}`}
      >
        {t('cookieSettings')}
      </button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={resetConsent} className={className}>
      <Cookie className="h-4 w-4 mr-2" />
      {t('cookieSettings')}
    </Button>
  )
}
