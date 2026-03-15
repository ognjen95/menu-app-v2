'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { ImageUpload } from '@/features/website-builder/BlockEditorComponents'
import { THEME_PRESETS, FONT_OPTIONS } from '@/lib/constants/website'

type Website = {
  primary_color?: string | null
  secondary_color?: string | null
  background_color?: string | null
  foreground_color?: string | null
  accent_color?: string | null
  font_heading?: string | null
  font_body?: string | null
  logo_url?: string | null
  mobile_header_image_url?: string | null
  [key: string]: unknown
}

type DesignPanelProps = {
  website?: Website | null
  updateWebsite: { mutate: (data: Partial<Website>) => void }
}

export default function DesignPanel({ website, updateWebsite }: DesignPanelProps) {
  const t = useTranslations('websiteBuilder')
  const [showAllThemes, setShowAllThemes] = useState(false)
  const [colorForm, setColorForm] = useState({
    primary_color: website?.primary_color || '#000000',
    secondary_color: website?.secondary_color || '#000000',
    background_color: website?.background_color || '#000000',
    foreground_color: website?.foreground_color || '#000000',
    accent_color: website?.accent_color || '#000000',
  })

  useEffect(() => {
    setColorForm({
      primary_color: website?.primary_color || '#000000',
      secondary_color: website?.secondary_color || '#000000',
      background_color: website?.background_color || '#000000',
      foreground_color: website?.foreground_color || '#000000',
      accent_color: website?.accent_color || '#000000',
    })
  }, [website?.primary_color, website?.secondary_color, website?.background_color, website?.foreground_color, website?.accent_color])

  const updateColors = (data: Partial<typeof colorForm>) => {
    setColorForm(prev => ({ ...prev, ...data }))
    updateWebsite.mutate(data)
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('design.darkThemes')}</h3>
        <motion.div 
          className="grid grid-cols-2 gap-2"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {THEME_PRESETS.filter(p => p.isDark).slice(0, showAllThemes ? undefined : 4).map((preset, index) => {
            const isSelected = colorForm?.primary_color === preset.primary &&
              colorForm?.background_color === preset.background &&
              colorForm?.accent_color === preset.accent
            return (
              <motion.div key={preset.name} variants={staggerItemScale} custom={index}>
                <button
                  onClick={() => updateColors({
                    primary_color: preset.primary,
                    secondary_color: preset.secondary,
                    background_color: preset.background,
                    foreground_color: preset.foreground,
                    accent_color: preset.accent,
                  })}
                  className={cn(
                    "p-2.5 rounded-lg border-2 text-left relative transition-all w-full",
                    isSelected ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-white/20"
                  )}
                  style={{ backgroundColor: preset.background }}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div className="flex gap-1 mb-1.5">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-[10px] truncate" style={{ color: preset.foreground }}>{preset.name}</p>
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('design.lightThemes')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {THEME_PRESETS.filter(p => !p.isDark).slice(0, showAllThemes ? undefined : 4).map((preset) => {
            const isSelected = website?.primary_color === preset.primary &&
              website?.background_color === preset.background &&
              website?.accent_color === preset.accent
            return (
              <button
                key={preset.name}
                onClick={() => updateColors({
                  primary_color: preset.primary,
                  secondary_color: preset.secondary,
                  background_color: preset.background,
                  foreground_color: preset.foreground,
                  accent_color: preset.accent,
                })}
                className={cn(
                  "p-2.5 rounded-lg border-2 text-left relative transition-all",
                  isSelected ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-zinc-300"
                )}
                style={{ backgroundColor: preset.background }}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                )}
                <div className="flex gap-1 mb-1.5">
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: preset.primary }} />
                  <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: preset.accent }} />
                </div>
                <p className="text-[10px] truncate" style={{ color: preset.foreground }}>{preset.name}</p>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setShowAllThemes(!showAllThemes)}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-1"
        >
          {showAllThemes ? t('design.showLess') : t('design.viewAllThemes', { count: THEME_PRESETS.length })}
        </button>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('design.colors')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['primary_color', 'primary'], 
            ['secondary_color', 'secondary'], 
            ['background_color', 'background'], 
            ['foreground_color', 'text'], 
            ['accent_color', 'accent']
          ].map(([field, labelKey]) => (
            <div key={field} className="space-y-1">
              <label className="text-xs text-muted-foreground">{t(`design.${labelKey}`)}</label>
              <div className="flex gap-2">
                <input 
                  type="color" 
                  value={colorForm[field as keyof typeof colorForm]} 
                  onChange={(e) => setColorForm(prev => ({ ...prev, [field]: e.target.value }))}
                  onBlur={(e) => updateColors({ [field]: e.target.value })} 
                  className="h-9 w-9 rounded border border-input cursor-pointer bg-transparent" 
                />
                <Input 
                  value={colorForm[field as keyof typeof colorForm]} 
                  onChange={(e) => setColorForm(prev => ({ ...prev, [field]: e.target.value }))}
                  onBlur={(e) => updateColors({ [field]: e.target.value })} 
                  className="flex-1 h-9 text-xs font-mono" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('design.typography')}</h3>
        {['font_heading', 'font_body'].map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t(`design.${field === 'font_heading' ? 'heading' : 'body'}`)}
            </label>
            <Select 
              value={website?.[field as keyof Website] as string || 'Inter'} 
              onValueChange={(v) => updateWebsite.mutate({ [field]: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('design.logo')}</h3>
        <ImageUpload
          value={website?.logo_url || ''}
          onChange={(url) => updateWebsite.mutate({ logo_url: url })}
          label=""
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">{t('design.mobileMenuHeader')}</h3>
        <p className="text-xs text-muted-foreground">{t('design.mobileMenuHeaderDesc')}</p>
        <ImageUpload
          value={website?.mobile_header_image_url || ''}
          onChange={(url) => updateWebsite.mutate({ mobile_header_image_url: url })}
          label=""
        />
      </div>
    </>
  )
}
