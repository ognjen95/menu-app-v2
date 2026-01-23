'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const businessTypes: { value: TenantType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'restaurant', label: 'Restaurant', icon: Utensils, description: 'Full-service dining' },
  { value: 'cafe', label: 'Cafe', icon: Coffee, description: 'Coffee shop or bakery' },
  { value: 'bar', label: 'Bar', icon: Wine, description: 'Bar or pub' },
  { value: 'salon', label: 'Salon', icon: Scissors, description: 'Hair or beauty salon' },
  { value: 'carshop', label: 'Car Shop', icon: Car, description: 'Auto repair or dealership' },
  { value: 'shop', label: 'Shop', icon: Store, description: 'Retail store' },
  { value: 'other', label: 'Other', icon: Building, description: 'Other business type' },
]

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
              <CardTitle className="text-2xl">What type of business do you have?</CardTitle>
              <CardDescription>
                Select the option that best describes your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {businessTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setData(prev => ({ ...prev, businessType: type.value }))}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                      data.businessType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <type.icon className={cn(
                      'h-8 w-8',
                      data.businessType === type.value ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end mt-8">
                <Button onClick={() => setStep(2)} disabled={!canProceed()}>
                  Continue
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
              <CardTitle className="text-2xl">Tell us about your business</CardTitle>
              <CardDescription>
                This information will be shown to your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., The Italian Kitchen"
                  value={data.businessName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">qrmenu.app/m/</span>
                  <Input
                    id="slug"
                    placeholder="the-italian-kitchen"
                    value={data.slug}
                    onChange={(e) => setData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be your unique menu URL
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@restaurant.com"
                    value={data.email}
                    onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
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
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!canProceed()}>
                  Continue
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
              <CardTitle className="text-2xl">Where is your business located?</CardTitle>
              <CardDescription>
                Add your main location - you can add more later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={data.address}
                  onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Belgrade"
                    value={data.city}
                    onChange={(e) => setData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
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
                  Back
                </Button>
                <Button 
                  onClick={() => createTenant.mutate()} 
                  disabled={createTenant.isPending}
                >
                  {createTenant.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create My Business
                    </>
                  )}
                </Button>
              </div>

              {createTenant.isError && (
                <p className="text-destructive text-sm text-center">
                  {createTenant.error instanceof Error 
                    ? createTenant.error.message 
                    : 'Failed to create business. Please try again.'}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
