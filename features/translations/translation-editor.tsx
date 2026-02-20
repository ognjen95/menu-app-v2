'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Languages, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TenantLanguage } from '@/lib/types'

export interface TranslationField {
  key: string
  label: string
  type: 'input' | 'textarea'
  placeholder?: string
  rows?: number
}

export type TranslationValues = Record<string, Record<string, string>>

interface TranslationEditorProps {
  languages: TenantLanguage[]
  translations: TranslationValues
  onTranslationsChange: (translations: TranslationValues) => void
  fields: TranslationField[]
  defaultValues?: { [fieldKey: string]: string }
  emptyStateTitle?: string
  emptyStateDescription?: string
}

export function TranslationEditor({
  languages,
  translations,
  onTranslationsChange,
  fields,
  defaultValues = {},
  emptyStateTitle,
  emptyStateDescription,
}: TranslationEditorProps) {
  const t = useTranslations('menuPage')
  const [selectedLang, setSelectedLang] = useState<string | null>(
    languages[0]?.language_code || null
  )

  // Update selected language if languages change
  useEffect(() => {
    if (languages.length > 0 && !languages.find(l => l.language_code === selectedLang)) {
      setSelectedLang(languages[0]?.language_code || null)
    }
  }, [languages, selectedLang])

  const handleFieldChange = (langCode: string, fieldKey: string, value: string) => {
    onTranslationsChange({
      ...translations,
      [langCode]: {
        ...translations[langCode],
        [fieldKey]: value,
      },
    })
  }

  // Check if a language has all required translations
  const getLanguageStatus = (langCode: string) => {
    const langTranslations = translations[langCode] || {}
    const missingFields: string[] = []
    
    fields.forEach(field => {
      const defaultValue = defaultValues[field.key]
      const translatedValue = langTranslations[field.key]
      
      // If there's a default value but no translation, it's missing
      if (defaultValue && !translatedValue) {
        missingFields.push(field.label)
      }
    })
    
    return {
      isComplete: missingFields.length === 0,
      missingFields,
      hasAnyTranslation: Object.values(langTranslations).some(v => v && v.trim() !== ''),
    }
  }

  // Count total missing translations
  const getMissingCount = () => {
    let count = 0
    languages.forEach(lang => {
      const status = getLanguageStatus(lang.language_code)
      count += status.missingFields.length
    })
    return count
  }

  if (languages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{emptyStateTitle || t('noLanguagesEnabled')}</p>
        <p className="text-sm">{emptyStateDescription || t('enableLanguagesHint')}</p>
      </div>
    )
  }

  const missingCount = getMissingCount()
  const currentLang = languages.find(l => l.language_code === selectedLang)
  const currentStatus = selectedLang ? getLanguageStatus(selectedLang) : null

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      {missingCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            {t('translationsMissingSummary', { count: missingCount })}
          </span>
        </div>
      )}

      <div className="flex gap-4 min-h-[240px]">
        {/* Language sidebar */}
        <div className="w-40 shrink-0 space-y-1 border-r pr-4">
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.language_code
            const status = getLanguageStatus(lang.language_code)
            
            return (
              <button
                key={lang.language_code}
                type="button"
                onClick={() => setSelectedLang(lang.language_code)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                )}
              >
                <span className="text-base">{lang.language?.flag_emoji}</span>
                <span className="truncate flex-1 text-xs">
                  {lang.language?.native_name || lang.language_code}
                </span>
                {!isSelected && (
                  <>
                    {status.isComplete && status.hasAnyTranslation ? (
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : status.hasAnyTranslation ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    ) : status.missingFields.length > 0 ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    ) : null}
                  </>
                )}
              </button>
            )
          })}
        </div>
        
        {/* Translation inputs */}
        <div className="flex-1 space-y-4">
          {selectedLang && currentLang && (
            <>
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentLang.language?.flag_emoji}</span>
                  <span className="font-medium">
                    {currentLang.language?.native_name || selectedLang}
                  </span>
                  {currentLang.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      {t('defaultLanguage')}
                    </Badge>
                  )}
                </div>
                {currentStatus && !currentStatus.isComplete && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t('translationsMissingCount', { count: currentStatus.missingFields.length })}
                  </Badge>
                )}
                {currentStatus && currentStatus.isComplete && currentStatus.hasAnyTranslation && (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                    <Check className="h-3 w-3 mr-1" />
                    {t('translationComplete')}
                  </Badge>
                )}
              </div>

              {fields.map((field) => {
                const value = translations[selectedLang]?.[field.key] || ''
                const defaultValue = defaultValues[field.key]
                const isMissing = defaultValue && !value
                
                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`trans-${field.key}-${selectedLang}`}>
                        {field.label}
                      </Label>
                      {isMissing && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                          {t('translationMissing')}
                        </Badge>
                      )}
                    </div>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`trans-${field.key}-${selectedLang}`}
                        value={value}
                        onChange={(e) => handleFieldChange(selectedLang, field.key, e.target.value)}
                        placeholder={field.placeholder || defaultValue}
                        rows={field.rows || 3}
                      />
                    ) : (
                      <Input
                        id={`trans-${field.key}-${selectedLang}`}
                        value={value}
                        onChange={(e) => handleFieldChange(selectedLang, field.key, e.target.value)}
                        placeholder={field.placeholder || defaultValue}
                      />
                    )}
                    {defaultValue && (
                      <p className="text-xs text-muted-foreground">
                        {t('originalValue', { value: defaultValue })}
                      </p>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
