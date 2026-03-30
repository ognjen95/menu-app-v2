'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { apiPost } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CountrySelector, PhoneSelector } from '@/features/selectors/components'
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
  Clock,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TenantType } from '@/lib/types'
import { defaultWorkingHours, type WorkingHours } from '@/lib/seed-data'
import { useAllActivePublicLanguages } from '@/features/translations'
import { ConversionTracking, trackConversion } from '@/lib/services/tracking'

const businessTypeIcons: Record<TenantType, React.ElementType> = {
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  salon: Scissors,
  carshop: Car,
  shop: Store,
  other: Building,
}

// * When update you must add seed data in seed-data.ts
const businessTypeKeys: TenantType[] = ['restaurant', 'cafe', 'bar']

// Fallback languages if DB fetch fails
const fallbackLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  // { code: 'de', name: 'German', flag: '🇩🇪' },
  // { code: 'fr', name: 'French', flag: '🇫🇷' },
  // { code: 'it', name: 'Italian', flag: '🇮🇹' },
  // { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  // { code: 'bs', name: 'Bosnian', flag: '🇧🇦' },
  // { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
  // { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  // { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  // { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
]

type LanguageFromDB = {
  code: string
  name: string
  native_name: string
  flag_emoji: string | null
  is_rtl: boolean
}

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

// =============================================================================
// Zod Validation Schemas for each step
// =============================================================================

// Helper function to create schemas with translated messages
const createValidationSchemas = (t: any) => {
  // Step 1: Business Type
  const step1Schema = z.object({
    businessType: z.enum(['restaurant', 'cafe', 'bar', 'salon', 'carshop', 'shop', 'other'], {
      message: t('validation.selectBusinessType'),
    }),
  })

  // Step 2: Business Details
  const step2Schema = z.object({
    businessName: z.string().min(2, t('validation.businessNameMin')),
    slug: z.string()
      .min(2, t('validation.slugMin'))
      .regex(/^[a-z0-9-]+$/, t('validation.slugInvalid')),
    email: z.string().email(t('validation.emailInvalid')),
    phone: z.string()
      .min(8, t('validation.phoneMin'))
      .regex(/^\+[0-9\s-]{7,}$/, t('validation.phoneInvalid')),
  })

  // Step 3: Location
  const step3Schema = z.object({
    address: z.string().min(3, t('validation.addressMin')),
    city: z.string().min(2, t('validation.cityMin')),
    country: z.string().min(2, t('validation.countryMin')),
  })

  // Working hours schema for a single day
  const dayHoursSchema = z.object({
    open: z.string(),
    close: z.string(),
    isOpen: z.boolean(),
  })

  // Step 4: Languages & Working Hours
  const step4Schema = z.object({
    selectedLanguages: z.array(z.string()).min(1, t('validation.selectLanguage')),
    defaultLanguage: z.string().min(1, t('validation.selectDefaultLanguage')),
    workingHours: z.object({
      monday: dayHoursSchema,
      tuesday: dayHoursSchema,
      wednesday: dayHoursSchema,
      thursday: dayHoursSchema,
      friday: dayHoursSchema,
      saturday: dayHoursSchema,
      sunday: dayHoursSchema,
    }),
    seedData: z.boolean(),
  })

  // Full schema for final submission
  const fullOnboardingSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema)

  return { step1Schema, step2Schema, step3Schema, step4Schema, fullOnboardingSchema }
}

type ValidationErrors = Record<string, string>

type OnboardingData = {
  businessType: TenantType | null
  businessName: string
  slug: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  workingHours: WorkingHours
  selectedLanguages: string[]
  defaultLanguage: string
  seedData: boolean
}

export default function OnboardingPage() {
  const t = useTranslations('onboardingPage')
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [data, setData] = useState<OnboardingData>({
    businessType: null,
    businessName: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'ES',
    workingHours: defaultWorkingHours,
    selectedLanguages: ['en'],
    defaultLanguage: 'en',
    seedData: true,
  })

  // Track signup conversion (user just registered and landed here)
  useEffect(() => {
    trackConversion(ConversionTracking.RegistrationCompleted)
  }, [])

  // Create validation schemas with translated messages
  const { step1Schema, step2Schema, step3Schema, step4Schema } = createValidationSchemas(t)

  // Validate current step and return errors
  const validateStep = useCallback((stepNumber: number): ValidationErrors => {
    let result
    switch (stepNumber) {
      case 1:
        result = step1Schema.safeParse({ businessType: data.businessType })
        break
      case 2:
        result = step2Schema.safeParse({
          businessName: data.businessName,
          slug: data.slug,
          email: data.email,
          phone: data.phone,
        })
        break
      case 3:
        result = step3Schema.safeParse({
          address: data.address,
          city: data.city,
          country: data.country,
        })
        break
      case 4:
        result = step4Schema.safeParse({
          selectedLanguages: data.selectedLanguages,
          defaultLanguage: data.defaultLanguage,
          workingHours: data.workingHours,
          seedData: data.seedData,
        })
        break
      default:
        return {}
    }

    if (!result.success) {
      const fieldErrors: ValidationErrors = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        const field = issue.path[0] as string
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })
      return fieldErrors
    }
    return {}
  }, [data, step1Schema, step2Schema, step3Schema, step4Schema])

  // Handle step navigation with validation
  const handleNextStep = useCallback(() => {
    const stepErrors = validateStep(step)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep(step + 1)
  }, [step, validateStep])

  // Clear field error when user types
  const clearError = useCallback((field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const { data: languagesData } = useAllActivePublicLanguages()

  // Use DB languages or fallback
  const availableLanguages = languagesData?.data?.languages?.map(lang => ({
    code: lang.code,
    name: lang.name,
    flag: lang.flag_emoji || '🏳️',
  })) || fallbackLanguages

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
        workingHours: data.workingHours,
        languages: data.selectedLanguages,
        defaultLanguage: data.defaultLanguage,
        seedData: data.seedData,
      })
      return response
    },
    onSuccess: () => {
      router.push('/dashboard/menu')
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'

      // Check for unique constraint violation
      if (errorMessage.includes('tenants_name_unique') || errorMessage.includes('duplicate key')) {
        toast.error(t('onboarding.errors.businessNameExists'), {
          description: t('onboarding.errors.businessNameExistsDesc')
        })
      } else {
        toast.error(t('onboarding.errors.createFailed'), {
          description: errorMessage
        })
      }
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

  const handleLanguageToggle = (langCode: string) => {
    setData(prev => {
      const isSelected = prev.selectedLanguages.includes(langCode)
      let newSelected: string[]
      let newDefault = prev.defaultLanguage

      if (isSelected) {
        // Don't allow removing the last language
        if (prev.selectedLanguages.length === 1) return prev
        newSelected = prev.selectedLanguages.filter(l => l !== langCode)
        // If removing the default language, set a new default
        if (newDefault === langCode) {
          newDefault = newSelected[0]
        }
      } else {
        newSelected = [...prev.selectedLanguages, langCode]
      }

      return { ...prev, selectedLanguages: newSelected, defaultLanguage: newDefault }
    })
  }

  const handleWorkingHoursChange = (day: keyof WorkingHours, field: 'open' | 'close' | 'isOpen', value: string | boolean) => {
    setData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }))
  }

  const totalSteps = 4

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className='mb-8 flex items-center justify-center gap-2'>
        <h1 className="text-7xl text-primary font-bold">KLOPAY</h1>
        <h1 className="text-6xl font-bold">.app</h1>
      </div>
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

              {errors.businessType && (
                <p className="text-destructive text-sm text-center mt-4">{errors.businessType}</p>
              )}

              <div className="flex justify-end mt-8">
                <Button onClick={handleNextStep}>
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
                  onChange={(e) => { handleNameChange(e.target.value); clearError('businessName') }}
                  className={errors.businessName ? 'border-destructive' : ''}
                />
                {errors.businessName && <p className="text-destructive text-sm">{errors.businessName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t('urlSlug')} *</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    placeholder="the-italian-kitchen"
                    value={data.slug}
                    onChange={(e) => { setData(prev => ({ ...prev, slug: generateSlug(e.target.value) })); clearError('slug') }}
                    className={cn("max-w-[300px]", errors.slug ? 'border-destructive' : '')}
                  />
                  <span className="text-muted-foreground text-sm">.klopay.app</span>
                </div>
                {errors.slug && <p className="text-destructive text-sm">{errors.slug}</p>}
                <p className="text-xs text-muted-foreground">
                  {t('uniqueMenuUrl')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@restaurant.com"
                    value={data.email}
                    onChange={(e) => { setData(prev => ({ ...prev, email: e.target.value })); clearError('email') }}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')} *</Label>
                  <PhoneSelector
                    filterByActive={false}
                    value={data.phone}
                    onValueChange={(value) => { setData(prev => ({ ...prev, phone: value })); clearError('phone') }}
                  />
                  {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => { setErrors({}); setStep(1) }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Button>
                <Button onClick={handleNextStep}>
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
                <Label htmlFor="address">{t('address')} *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={data.address}
                  onChange={(e) => { setData(prev => ({ ...prev, address: e.target.value })); clearError('address') }}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && <p className="text-destructive text-sm">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')} *</Label>
                  <Input
                    id="city"
                    placeholder="Belgrade"
                    value={data.city}
                    onChange={(e) => { setData(prev => ({ ...prev, city: e.target.value })); clearError('city') }}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('country')} *</Label>
                  <CountrySelector
                    filterByActive={false}
                    value={data.country}
                    onValueChange={(value) => { setData(prev => ({ ...prev, country: value })); clearError('country') }}
                  />
                  {errors.country && <p className="text-destructive text-sm">{errors.country}</p>}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => { setErrors({}); setStep(2) }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Button>
                <Button onClick={handleNextStep}>
                  {t('continue')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Working Hours & Languages */}
        {step === 4 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('step4Title')}</CardTitle>
              <CardDescription>
                {t('step4Desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Languages Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('languagesTitle')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t('languagesDesc')}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableLanguages.map((lang) => {
                    const isSelected = data.selectedLanguages.includes(lang.code)
                    const isDefault = data.defaultLanguage === lang.code
                    return (
                      <div
                        key={lang.code}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer',
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => handleLanguageToggle(lang.code)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleLanguageToggle(lang.code)}
                        />
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                        {isDefault && (
                          <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            {t('default')}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {data.selectedLanguages.length > 1 && (
                  <div className="space-y-2">
                    <Label>{t('defaultLanguage')}</Label>
                    <Select
                      value={data.defaultLanguage}
                      onValueChange={(value) => setData(prev => ({ ...prev, defaultLanguage: value }))}
                    >
                      <SelectTrigger className="h-10 rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {data.selectedLanguages.map(code => {
                          const lang = availableLanguages.find(l => l.code === code)
                          return (
                            <SelectItem key={code} value={code}>
                              {lang?.flag} {lang?.name}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Working Hours Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{t('workingHoursTitle')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{t('workingHoursDesc')}</p>

                <div className="space-y-3">
                  {dayKeys.map((day) => (
                    <div key={day} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-24 font-medium text-sm">{t(`days.${day}`)}</div>
                      <Switch
                        checked={data.workingHours[day].isOpen}
                        onCheckedChange={(checked) => handleWorkingHoursChange(day, 'isOpen', checked)}
                      />
                      {data.workingHours[day].isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={data.workingHours[day].open}
                            onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                            className="w-28"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={data.workingHours[day].close}
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
              </div>

              {/* Seed Data Option */}
              {/* [DEFAULT IS TRUE] DON'T SHOW THIS OPTION TO USER */}
              {/* <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{t('seedDataTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('seedDataDesc')}</p>
                  </div>
                  <Switch
                    checked={data.seedData}
                    onCheckedChange={(checked) => setData(prev => ({ ...prev, seedData: checked }))}
                  />
                </div>
              </div> */}

              {errors.selectedLanguages && (
                <p className="text-destructive text-sm">{errors.selectedLanguages}</p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => { setErrors({}); setStep(3) }}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('back')}
                </Button>
                <Button
                  onClick={() => {
                    const stepErrors = validateStep(4)
                    if (Object.keys(stepErrors).length > 0) {
                      setErrors(stepErrors)
                      return
                    }
                    createTenant.mutate()
                  }}
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
