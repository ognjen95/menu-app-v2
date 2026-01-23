'use client'

import { useState } from 'react'
import { useCurrentTenant, useUpdateTenant } from '@/lib/hooks/use-tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  CreditCard,
  Globe,
  Bell,
  Shield,
  Loader2,
  Check,
  Crown,
} from 'lucide-react'

export default function SettingsPage() {
  const { data, isLoading } = useCurrentTenant()
  const updateTenant = useUpdateTenant()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    timezone: string
    default_currency: string
  } | null>(null)

  const tenant = data?.tenant

  const handleEdit = () => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        timezone: tenant.timezone,
        default_currency: tenant.default_currency,
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
            <div>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Business Name</Label>
                <p className="font-medium">{tenant.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">URL</Label>
                <p className="font-medium font-mono">/m/{tenant.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{tenant.email || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{tenant.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Currency</Label>
                <p className="font-medium">{tenant.default_currency}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">VAT Rate</Label>
                <p className="font-medium">{tenant.vat_rate}%</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            <Badge variant={tenant.plan === 'pro' ? 'default' : 'secondary'} className="gap-1">
              {tenant.plan === 'pro' && <Crown className="h-3 w-3" />}
              {tenant.plan.toUpperCase()} Plan
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

          <div className="grid gap-2 text-sm">
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
            {tenant.plan === 'pro' && (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick settings links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5" />
              Languages
            </CardTitle>
            <CardDescription>Configure supported languages</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Security and privacy settings</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
