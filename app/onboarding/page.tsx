'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Store,
  Coffee,
  Utensils,
  Wine,
  Scissors,
  Car,
  Building,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TenantType } from '@/lib/types'

const businessTypeIcons: Record<TenantType, React.ElementType> = {
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  salon: Scissors,
  carshop: Car,
  shop: Store,
  other: Building,
}

const businessTypeKeys: TenantType[] = ['restaurant', 'cafe', 'bar', 'salon', 'carshop', 'shop', 'other']

type OnboardingData = {
  businessType: TenantType | null
  businessName: string
  slug: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

export default function OnboardingPage() {
  const t = useTranslations('onboardingPage')
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    businessType: null,
    businessName: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'RS',
  })

  const createTenant = useMutation({
    mutationFn: async () => {
      const response = await apiPost<{ tenant: { id: string; slug: string } }>('/tenant/create', {
        name: data.businessName,
        slug: data.slug,
        type: data.businessType,
        email: data.email,
        phone: data.phone,
        country: data.country,
        location: {
          name: 'Main Location',
          address: data.address,
          city: data.city,
          country: data.country,
        },
      })
      return response
    },
    onSuccess: () => {
      router.push('/dashboard')
    },
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setData(prev => ({
      ...prev,
      businessName: name,
      slug: generateSlug(name),
    }))
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.businessType !== null
      case 2:
        return data.businessName.length >= 2 && data.slug.length >= 2
      case 3:
        return true // Optional fields
      default:
        return false
    }
  }

  const totalSteps = 3

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all',
                i + 1 === step ? 'w-8 bg-primary' :
                i + 1 < step ? 'w-8 bg-primary/50' : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Step 1: Business Type */}
        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('step1Title')}</CardTitle>
              <CardDescription>
                {t('step1Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {businessTypeKeys.map((typeKey) => {
                  const Icon = businessTypeIcons[typeKey]
                  return (
                    <button
                      key={typeKey}
                      onClick={() => setData(prev => ({ ...prev, businessType: typeKey }))}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        data.businessType === typeKey
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted'
                      )}
                    >
                      <Icon className={cn(
                        'h-8 w-8',
                        data.businessType === typeKey ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <span className="font-medium">{t(`businessTypes.${typeKey}`)}</span>
                      <span className="text-xs text-muted-foreground text-center">{t(`businessTypes.${typeKey}Desc`)}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end mt-8">
                <Button onClick={() => setStep(2)} disabled={!canProceed()}>
                  {t('continue')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('step2Title')}</CardTitle>
              <CardDescription>
                {t('step2Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('businessName')} *</Label>
                <Input
                  id="name"
                  placeholder={t('businessNamePlaceholder')}
                  value={data.businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t('urlSlug')} *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">klopay.app/m/</span>
                  <Input
                    id="slug"
                    placeholder="the-italian-kitchen"
                    value={data.slug}
                    onChange={(e) => setData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('uniqueMenuUrl')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@restaurant.com"
                    value={data.email}
                    onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    placeholder="+381 11 123 4567"
                    value={data.phone}
                    onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceed()}>
                  {t('continue')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('step3Title')}</CardTitle>
              <CardDescription>
                {t('step3Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">{t('address')}</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={data.address}
                  onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input
                    id="city"
                    placeholder="Belgrade"
                    value={data.city}
                    onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('country')}</Label>
                  <select
                    id="country"
                    value={data.country}
                    onChange={(e) => setData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="RS">Serbia</option>
                    <option value="BA">Bosnia and Herzegovina</option>
                    <option value="HR">Croatia</option>
                    <option value="SI">Slovenia</option>
                    <option value="ME">Montenegro</option>
                    <option value="MK">North Macedonia</option>
                    <option value="DE">Germany</option>
                    <option value="AT">Austria</option>
                    <option value="IT">Italy</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="NL">Netherlands</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Button>
                <Button 
                  onClick={() => createTenant.mutate()} 
                  disabled={createTenant.isPending}
                >
                  {createTenant.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('creating')}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('createMyBusiness')}
                    </>
                  )}
                </Button>
              </div>

              {createTenant.isError && (
                <p className="text-destructive text-sm text-center">
                  {createTenant.error instanceof Error 
                    ? createTenant.error.message 
                    : t('failedToCreate')}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
