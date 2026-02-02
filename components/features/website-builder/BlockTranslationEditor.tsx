'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { TranslationEditor, type TranslationValues } from '@/components/features/translations/translation-editor'
import { useTenantLanguages, useTranslationsByPrefix, useSaveTranslations, getBlockTranslationPrefix } from '@/lib/hooks/use-translations'
import { 
  getTranslatableFields, 
  getDefaultValues, 
  convertTranslationsToApiFormat,
  convertTranslationsFromApiFormat 
} from '@/lib/utils/website-block-translations'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Save, Languages, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface BlockTranslationEditorProps {
  blockId: string
  blockType: string
  content: Record<string, unknown>
  onSaved?: () => void
}

export function BlockTranslationEditor({
  blockId,
  blockType,
  content,
  onSaved,
}: BlockTranslationEditorProps) {
  const t = useTranslations('websiteBuilder')
  
  // Fetch tenant languages
  const { data: languagesData, isLoading: loadingLanguages } = useTenantLanguages()
  const tenantLanguages = languagesData?.data?.languages || []
  
  // Fetch existing translations for this block
  const translationPrefix = getBlockTranslationPrefix(blockId)
  const { data: existingData, isLoading: loadingTranslations } = useTranslationsByPrefix(translationPrefix)
  
  // Save translations mutation
  const saveTranslations = useSaveTranslations()
  
  // Local state for translations
  const [translations, setTranslations] = useState<TranslationValues>({})
  const [hasChanges, setHasChanges] = useState(false)
  
  // Get translatable fields for this block type
  const fields = useMemo(() => 
    getTranslatableFields(blockType, content),
    [blockType, content]
  )
  
  // Get default values from content
  const defaultValues = useMemo(() => 
    getDefaultValues(blockType, content),
    [blockType, content]
  )
  
  // Initialize translations from existing data
  useEffect(() => {
    if (existingData?.data?.translations) {
      const converted = convertTranslationsFromApiFormat(blockId, existingData.data.translations)
      setTranslations(converted)
      setHasChanges(false)
    }
  }, [existingData, blockId])
  
  // Handle translations change
  const handleTranslationsChange = (newTranslations: TranslationValues) => {
    setTranslations(newTranslations)
    setHasChanges(true)
  }
  
  // Handle save
  const handleSave = async () => {
    const apiTranslations = convertTranslationsToApiFormat(blockId, translations)
    
    if (apiTranslations.length === 0) {
      toast.info(t('translations.noTranslationsToSave'))
      return
    }
    
    try {
      await saveTranslations.mutateAsync(apiTranslations)
      toast.success(t('translations.savedSuccess'))
      setHasChanges(false)
      onSaved?.()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('translations.saveFailed'), {
        description: errorMessage,
      })
    }
  }
  
  // Loading state
  if (loadingLanguages || loadingTranslations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    )
  }
  
  // No languages enabled
  if (tenantLanguages.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{t('translations.noLanguages')}</p>
        <p className="text-sm text-zinc-500 mt-1">{t('translations.enableLanguagesHint')}</p>
      </div>
    )
  }
  
  // No translatable fields for this block
  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{t('translations.noTranslatableFields')}</p>
        <p className="text-sm text-zinc-500 mt-1">{t('translations.blockNoTextContent')}</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Translation Editor with scroll */}
      <ScrollArea className="flex-1 h-[42vh]">
        <div className="pr-4">
          <TranslationEditor
            languages={tenantLanguages}
            translations={translations}
            onTranslationsChange={handleTranslationsChange}
            fields={fields}
            defaultValues={defaultValues}
            emptyStateTitle={t('translations.noLanguages')}
            emptyStateDescription={t('translations.enableLanguagesHint')}
          />
        </div>
      </ScrollArea>
      
      {/* Save Button */}
      <div className="flex justify-end pt-4 mt-4 border-t border-zinc-800">
        <Button
          onClick={handleSave}
          disabled={saveTranslations.isPending || !hasChanges}
          className="bg-primary hover:bg-primary/90"
        >
          {saveTranslations.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('translations.saveTranslations')}
        </Button>
      </div>
    </div>
  )
}
