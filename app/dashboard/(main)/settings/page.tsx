'use client'

import { useState, useEffect } from 'react'
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

type TenantSettings = {
  online_payments_enabled?: boolean
  takeaway_enabled?: boolean
  dine_in_enabled?: boolean
  delivery_enabled?: boolean
}

export default function SettingsPage() {
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No business found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business settings and preferences
        </p>
      </div>

      {/* Business info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Update your business details</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && formData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
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
                  <Label htmlFor="vat_rate">VAT Rate (%)</Label>
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
                  <Label htmlFor="timezone">Timezone</Label>
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
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-muted-foreground text-xs">Business Name</Label>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Menu URL</Label>
                <p className="font-medium font-mono text-sm">/m/{tenant.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="font-medium">{tenant.email || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Phone</Label>
                <p className="font-medium">{tenant.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Currency</Label>
                <p className="font-medium">{tenant.default_currency}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">VAT Rate</Label>
                <p className="font-medium">{tenant.vat_rate}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Order Settings</CardTitle>
              <CardDescription>Configure how customers can order from you</CardDescription>
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
                <p className="font-medium">Dine-In Orders</p>
                <p className="text-sm text-muted-foreground">Allow customers to order from their table</p>
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
                <p className="font-medium">Takeaway Orders</p>
                <p className="text-sm text-muted-foreground">Allow customers to order for pickup</p>
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
                <p className="font-medium">Delivery Orders</p>
                <p className="text-sm text-muted-foreground">Allow customers to order for delivery (requires address)</p>
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
                <p className="font-medium">Online Payments</p>
                <p className="text-sm text-muted-foreground">Accept card payments through Stripe</p>
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
                Online payments are enabled. Customers can pay with their card during checkout.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </div>
            </div>
            <Badge variant={tenant.plan === 'pro' ? 'default' : 'secondary'} className="gap-1">
              {tenant.plan === 'pro' && <Crown className="h-3 w-3" />}
              {tenant.plan?.toUpperCase() || 'BASIC'} Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div>
              <p className="font-medium">
                {tenant.plan === 'basic' ? 'Basic Plan' : 'Pro Plan'}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: <span className="capitalize">{tenant.subscription_status}</span>
                {tenant.trial_ends_at && tenant.subscription_status === 'trialing' && (
                  <> • Trial ends {new Date(tenant.trial_ends_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
            {tenant.plan === 'basic' && (
              <Button>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-sm">Included Features</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Menu management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Order management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>QR code generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Website builder</span>
                </div>
              </div>
            </div>
            {tenant.plan === 'pro' && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Pro Features</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>AI translations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Inventory management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
