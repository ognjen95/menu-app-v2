'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useCurrentTenant, useUpdateTenant, useLocations, useUpdateLocation } from '@/lib/hooks/use-tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Info,
  Clock,
  Star,
} from 'lucide-react'
import { motion } from '@/components/ui/animated'
import { Skeleton } from '@/components/ui/skeleton'
import { Currency } from '@/lib/types'
import { CURRENCY_SYMBOL_MAP } from '@/lib/constants/currency'
import { defaultWorkingHours, type WorkingHours } from '@/lib/seed-data'

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type TenantSettings = {
  online_payments_enabled?: boolean
  takeaway_enabled?: boolean
  dine_in_enabled?: boolean
  delivery_enabled?: boolean
}

export default function SettingsPage() {
  const t = useTranslations('settingsPage')
  const tCommon = useTranslations('common')
  const { data, isLoading, refetch } = useCurrentTenant()
  const { data: locationsData, refetch: refetchLocations } = useLocations()
  const updateTenant = useUpdateTenant()
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingHours, setIsEditingHours] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isSavingHours, setIsSavingHours] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    timezone: string
    default_currency: Currency
    vat_rate: number
  } | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours)

  const tenant = data?.data?.tenant
  const locations = locationsData?.data?.locations || []
  const mainLocation = locations[0]
  const settings: TenantSettings = (tenant?.settings as TenantSettings) || {}

  // Load working hours from main location (transform from opening_hours format)
  useEffect(() => {
    if (mainLocation?.opening_hours) {
      const openingHours = mainLocation.opening_hours as unknown as Record<string, { open: string; close: string; is_closed: boolean }>
      const transformed = Object.fromEntries(
        Object.entries(openingHours).map(([day, hours]) => [
          day,
          { open: hours.open, close: hours.close, isOpen: !hours.is_closed }
        ])
      ) as WorkingHours
      setWorkingHours(transformed)
    }
  }, [mainLocation])

  // const handleWorkingHoursChange = (day: keyof WorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
  //   setWorkingHours(prev => ({
  //     ...prev,
  //     [day]: {
  //       ...prev[day],
  //       [field]: value,
  //     },
  //   }))
  // }

  // const handleSaveWorkingHours = async () => {
  //   if (!mainLocation) return
  //   setIsSavingHours(true)
  //   try {
  //     // Transform WorkingHours (isOpen) to OpeningHours (is_closed) format
  //     const openingHours = Object.fromEntries(
  //       Object.entries(workingHours).map(([day, hours]) => [
  //         day,
  //         { open: hours.open, close: hours.close, is_closed: !hours.isOpen }
  //       ])
  //     )
  //     await updateLocation.mutateAsync({
  //       id: mainLocation.id,
  //       opening_hours: openingHours as any,
  //     })
  //     refetchLocations()
  //     setIsEditingHours(false)
  //   } finally {
  //     setIsSavingHours(false)
  //   }
  // }

  const handleEdit = () => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        timezone: tenant.timezone || 'Europe/Belgrade',
        default_currency: tenant.default_currency || 'EUR',
        vat_rate: tenant.vat_rate ?? 20,
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
                  <Select
                    value={formData.default_currency}
                    onValueChange={(value) => setFormData({ ...formData, default_currency: value as Currency })}
                  >
                    <SelectTrigger className="h-10 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_SYMBOL_MAP).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {key} ({value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="flex gap-2 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-sm">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                      <p>{t('vatInfo')}</p>
                      <p className="mt-1 font-medium text-foreground">{t('vatAdvice')}</p>
                    </div>
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger className="h-10 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Belgrade">Europe/Belgrade (CET)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris (CET)</SelectItem>
                      <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}
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
            {/* UNCOMENT WHEN INTEGRATE PAYMENTS */}
            {/* <Switch
              checked={settings.online_payments_enabled === true}
              onCheckedChange={(checked) => handleSettingToggle('online_payments_enabled', checked)}
              disabled={isSavingSettings}
            /> */}
            <Badge>
              <Star className='h-5 w-5 mr-3' />
              {tCommon('comingSoon')}
            </Badge>
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

      {/* Working Hours */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>{t('workingHours')}</CardTitle>
                <CardDescription>{t('workingHoursDesc')}</CardDescription>
              </div>
            </div>
            {!isEditingHours && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={() => setIsEditingHours(true)}>
                  {t('edit')}
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingHours ? (
            <>
              <div className="space-y-3">
                {dayKeys.map((day) => (
                  <div key={day} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="w-24 font-medium text-sm">{t(`days.${day}`)}</div>
                    <Switch
                      checked={workingHours[day]?.isOpen ?? true}
                      onCheckedChange={(checked) => handleWorkingHoursChange(day, 'isOpen', checked)}
                    />
                    {workingHours[day]?.isOpen ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={workingHours[day]?.open || '09:00'}
                          onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                          className="w-28"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={workingHours[day]?.close || '22:00'}
                          onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                          className="w-28"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('closed')}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveWorkingHours} disabled={isSavingHours}>
                  {isSavingHours && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditingHours(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {dayKeys.map((day) => (
                <div key={day} className="flex items-center gap-3 py-1">
                  <div className="w-24 font-medium text-sm">{t(`days.${day}`)}</div>
                  {workingHours[day]?.isOpen ? (
                    <span className="text-sm">
                      {workingHours[day]?.open || '09:00'} - {workingHours[day]?.close || '22:00'}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('closed')}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div> */}

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
