'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrentTenant, useUpdateTenant } from '@/lib/hooks/use-tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  CreditCard,
  Loader2,
  Check,
  Crown,
  Store,
  Receipt,
  ShoppingBag,
  Utensils,
  Truck,
} from 'lucide-react'
import { motion } from '@/components/ui/animated'
import { Skeleton } from '@/components/ui/skeleton'

type TenantSettings = {
  online_payments_enabled?: boolean
  takeaway_enabled?: boolean
  dine_in_enabled?: boolean
  delivery_enabled?: boolean
}

export default function SettingsPage() {
  const t = useTranslations('settingsPage')
  const { data, isLoading, refetch } = useCurrentTenant()
  const updateTenant = useUpdateTenant()
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    timezone: string
    default_currency: string
    vat_rate: number
  } | null>(null)

  const tenant = data?.data?.tenant
  const settings: TenantSettings = (tenant?.settings as TenantSettings) || {}

  const handleEdit = () => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        timezone: tenant.timezone || 'Europe/Belgrade',
        default_currency: tenant.default_currency || 'EUR',
        vat_rate: tenant.vat_rate || 20,
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (formData) {
      await updateTenant.mutateAsync(formData)
      setIsEditing(false)
    }
  }

  const handleSettingToggle = async (key: keyof TenantSettings, value: boolean) => {
    if (!tenant) return
    setIsSavingSettings(true)
    try {
      await updateTenant.mutateAsync({
        settings: {
          ...settings,
          [key]: value,
        },
      })
      refetch()
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('noBusinessFound')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </motion.div>

      {/* Business info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('businessInfo')}</CardTitle>
                <CardDescription>{t('updateBusinessDetails')}</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={handleEdit}>
                  {t('edit')}
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && formData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('businessName')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
                  <select
                    id="currency"
                    value={formData.default_currency}
                    onChange={(e) => setFormData({ ...formData, default_currency: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="RSD">RSD (din.)</option>
                    <option value="BAM">BAM (KM)</option>
                    <option value="HRK">HRK (kn)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_rate">{t('vatRate')}</Label>
                  <Input
                    id="vat_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="Europe/Belgrade">Europe/Belgrade (CET)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={updateTenant.isPending}>
                  {updateTenant.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-muted-foreground text-xs">{t('businessName')}</Label>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t('menuUrl')}</Label>
                <p className="font-medium font-mono text-sm">/m/{tenant.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t('email')}</Label>
                <p className="font-medium">{tenant.email || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t('phone')}</Label>
                <p className="font-medium">{tenant.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t('currency')}</Label>
                <p className="font-medium">{tenant.default_currency}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t('vatRate')}</Label>
                <p className="font-medium">{tenant.vat_rate}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Order Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>{t('orderSettings')}</CardTitle>
              <CardDescription>{t('configureOrders')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dine In */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Utensils className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{t('dineInOrders')}</p>
                <p className="text-sm text-muted-foreground">{t('dineInDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.dine_in_enabled !== false}
              onCheckedChange={(checked) => handleSettingToggle('dine_in_enabled', checked)}
              disabled={isSavingSettings}
            />
          </div>

          {/* Takeaway */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{t('takeawayOrders')}</p>
                <p className="text-sm text-muted-foreground">{t('takeawayDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.takeaway_enabled !== false}
              onCheckedChange={(checked) => handleSettingToggle('takeaway_enabled', checked)}
              disabled={isSavingSettings}
            />
          </div>

          {/* Delivery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{t('deliveryOrders')}</p>
                <p className="text-sm text-muted-foreground">{t('deliveryDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.delivery_enabled === true}
              onCheckedChange={(checked) => handleSettingToggle('delivery_enabled', checked)}
              disabled={isSavingSettings}
            />
          </div>

          {/* Online Payments */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="font-medium">{t('onlinePayments')}</p>
                <p className="text-sm text-muted-foreground">{t('onlinePaymentsDesc')}</p>
              </div>
            </div>
            <Switch
              checked={settings.online_payments_enabled === true}
              onCheckedChange={(checked) => handleSettingToggle('online_payments_enabled', checked)}
              disabled={isSavingSettings}
            />
          </div>
          {settings.online_payments_enabled && (
            <div className="ml-12 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-700 dark:text-green-400">
                {t('onlinePaymentsEnabled')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>{t('subscription')}</CardTitle>
                <CardDescription>{t('manageSubscription')}</CardDescription>
              </div>
            </div>
            <Badge variant={tenant.plan === 'pro' ? 'default' : 'secondary'} className="gap-1">
              {tenant.plan === 'pro' && <Crown className="h-3 w-3" />}
              {tenant.plan?.toUpperCase() || 'BASIC'} {t('plan')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="font-medium">
                {tenant.plan === 'basic' ? t('basicPlan') : t('proPlan')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('status')}: <span className="capitalize">{tenant.subscription_status}</span>
                {tenant.trial_ends_at && tenant.subscription_status === 'trialing' && (
                  <> • {t('trialEnds')} {new Date(tenant.trial_ends_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
            {tenant.plan === 'basic' && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button>
                  <Crown className="h-4 w-4 mr-2" />
                  {t('upgradeToPro')}
                </Button>
              </motion.div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-sm">{t('includedFeatures')}</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('features.menuManagement')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('features.orderManagement')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('features.qrCodeGeneration')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{t('features.websiteBuilder')}</span>
                </div>
              </div>
            </div>
            {tenant.plan === 'pro' && (
              <div className="space-y-2">
                <p className="font-medium text-sm">{t('proFeatures')}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{t('features.aiTranslations')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{t('features.advancedAnalytics')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{t('features.inventoryManagement')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{t('features.prioritySupport')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
