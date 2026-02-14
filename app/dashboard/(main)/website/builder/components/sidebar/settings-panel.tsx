'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Facebook, Instagram, Twitter } from 'lucide-react'

type Website = {
  subdomain?: string | null
  seo_title?: string | null
  seo_description?: string | null
  social_links?: { 
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string 
  }
  [key: string]: unknown
}

type SettingsPanelProps = {
  website?: Website | null
  updateWebsite: { mutate: (data: Partial<Website>, options?: { onSettled?: () => void }) => void }
  setIsSubdomainUpdating: (updating: boolean) => void
}

export default function SettingsPanel({
  website,
  updateWebsite,
  setIsSubdomainUpdating,
}: SettingsPanelProps) {
  const t = useTranslations('websiteBuilder')
  
  const [settingsForm, setSettingsForm] = useState({
    subdomain: '',
    seo_title: '',
    seo_description: '',
    facebook: '',
    instagram: '',
    twitter: '',
  })

  // Sync form with website data
  useEffect(() => {
    if (website) {
      setSettingsForm({
        subdomain: website.subdomain || '',
        seo_title: website.seo_title || '',
        seo_description: website.seo_description || '',
        facebook: website.social_links?.facebook || '',
        instagram: website.social_links?.instagram || '',
        twitter: website.social_links?.twitter || '',
      })
    }
  }, [website])

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('settings.domain')}</h3>
        <div className="flex gap-2">
          <Input 
            value={settingsForm.subdomain} 
            onChange={(e) => setSettingsForm(f => ({ 
              ...f, 
              subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
            }))}
            onBlur={() => {
              if (settingsForm.subdomain && settingsForm.subdomain !== (website?.subdomain || '')) {
                setIsSubdomainUpdating(true)
                updateWebsite.mutate({ subdomain: settingsForm.subdomain }, {
                  onSettled: () => {
                    setTimeout(() => setIsSubdomainUpdating(false), 1500)
                  }
                })
              }
            }}
          />
          <span className="flex items-center text-xs text-muted-foreground">.klopay.app</span>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('settings.seo')}</h3>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t('settings.seoTitle')}</label>
          <Input 
            value={settingsForm.seo_title} 
            onChange={(e) => setSettingsForm(f => ({ ...f, seo_title: e.target.value }))}
            onBlur={() => {
              if (settingsForm.seo_title !== (website?.seo_title || '')) {
                updateWebsite.mutate({ seo_title: settingsForm.seo_title })
              }
            }}
            className="text-sm"
            maxLength={60} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t('settings.seoDescription')}</label>
          <Textarea 
            value={settingsForm.seo_description}
            onChange={(e) => setSettingsForm(f => ({ ...f, seo_description: e.target.value }))}
            onBlur={() => {
              if (settingsForm.seo_description !== (website?.seo_description || '')) {
                updateWebsite.mutate({ seo_description: settingsForm.seo_description })
              }
            }}
            className="text-sm resize-none"
            rows={3} 
            maxLength={160} 
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('settings.socialLinks')}</h3>
        <div className="flex items-center gap-2">
          <Facebook className="h-4 w-4 text-muted-foreground" />
          <Input 
            value={settingsForm.facebook} 
            onChange={(e) => setSettingsForm(f => ({ ...f, facebook: e.target.value }))}
            onBlur={() => {
              if (settingsForm.facebook !== (website?.social_links?.facebook || '')) {
                updateWebsite.mutate({ 
                  social_links: { ...website?.social_links, facebook: settingsForm.facebook } 
                })
              }
            }}
            placeholder="facebook.com/..." 
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <Input 
            value={settingsForm.instagram} 
            onChange={(e) => setSettingsForm(f => ({ ...f, instagram: e.target.value }))}
            onBlur={() => {
              if (settingsForm.instagram !== (website?.social_links?.instagram || '')) {
                updateWebsite.mutate({ 
                  social_links: { ...website?.social_links, instagram: settingsForm.instagram } 
                })
              }
            }}
            placeholder="instagram.com/..." 
            className="text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Twitter className="h-4 w-4 text-muted-foreground" />
          <Input 
            value={settingsForm.twitter} 
            onChange={(e) => setSettingsForm(f => ({ ...f, twitter: e.target.value }))}
            onBlur={() => {
              if (settingsForm.twitter !== (website?.social_links?.twitter || '')) {
                updateWebsite.mutate({ 
                  social_links: { ...website?.social_links, twitter: settingsForm.twitter } 
                })
              }
            }}
            placeholder="twitter.com/..." 
            className="text-sm"
          />
        </div>
      </div>
    </>
  )
}
