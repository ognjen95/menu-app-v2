'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Check, Sparkles, File, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_TYPES, WEBSITE_TEMPLATES, type WebsiteTemplate } from '@/lib/constants/website'
import { motion } from '@/components/ui/animated'
import { toast } from 'sonner'
import type { WebsitePage } from './preview-and-editor.'

type TemplateSelectionContainerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pages: WebsitePage[]
  onStartFromScratch: () => void
}

export function TemplateSelectionContainer({
  open,
  onOpenChange,
  pages,
  onStartFromScratch,
}: TemplateSelectionContainerProps) {
  const t = useTranslations('websiteBuilder')
  const queryClient = useQueryClient()

  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [templateProgress, setTemplateProgress] = useState({ current: 0, total: 0, step: '' })

  // Apply a template (theme + create page + blocks)
  const applyTemplate = useCallback(async (template: WebsiteTemplate) => {
    setIsApplyingTemplate(true)
    const totalSteps = template.blocks.length + 2
    setTemplateProgress({ current: 0, total: totalSteps, step: t('templates.applyingTheme') || 'Applying theme...' })

    try {
      // 1. Apply theme
      await apiPatch('/website', template.theme)
      setTemplateProgress({ current: 1, total: totalSteps, step: t('templates.creatingPage') || 'Creating page...' })

      // 2. Find existing home page or create new one
      let pageId: string | undefined
      const existingHomePage = pages.find(p => p.slug === 'home')

      if (existingHomePage) {
        pageId = existingHomePage.id
        const existingBlocks = await apiGet<{ data: { blocks: { id: string }[] } }>(`/website/pages/${pageId}/blocks`)
        if (existingBlocks?.data?.blocks) {
          for (const block of existingBlocks.data.blocks) {
            await apiDelete(`/website/blocks/${block.id}`)
          }
        }
      } else {
        const pageResponse = await apiPost<{ data: { page: { id: string } } }>('/website/pages', { title: 'Home', slug: 'home' })
        pageId = pageResponse?.data?.page?.id
      }

      if (pageId) {
        for (let i = 0; i < template.blocks.length; i++) {
          const block = template.blocks[i]
          const blockLabel = BLOCK_TYPES.find(b => b.type === block.type)?.label || block.type
          setTemplateProgress({
            current: i + 2,
            total: totalSteps,
            step: `${t('templates.addingBlock') || 'Adding'} ${blockLabel}...`,
          })

          await apiPost(`/website/pages/${pageId}/blocks`, {
            type: block.type,
            content: block.content,
            settings: block.settings,
          })
        }
      }

      setTemplateProgress({ current: totalSteps, total: totalSteps, step: t('templates.finishing') || 'Finishing up...' })

      await queryClient.invalidateQueries({ queryKey: ['website'] })
      await queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      if (pageId) {
        await queryClient.invalidateQueries({ queryKey: ['website-blocks', pageId] })
      }

      onOpenChange(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast.error(t('templates.applyFailed') || 'Failed to apply template')
    } finally {
      setIsApplyingTemplate(false)
      setTemplateProgress({ current: 0, total: 0, step: '' })
    }
  }, [pages, queryClient, t, onOpenChange])

  // Start from scratch - close modal and trigger callback
  const handleStartFromScratch = useCallback(() => {
    onOpenChange(false)
    setSelectedTemplate(null)
    onStartFromScratch()
  }, [onOpenChange, onStartFromScratch])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isApplyingTemplate) onOpenChange(o) }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Loading overlay when applying template */}
        {isApplyingTemplate && (
          <div className="absolute inset-0 bg-background/98 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t('templates.buildingWebsite') || 'Building your website...'}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">{templateProgress.step}</p>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${templateProgress.total > 0 ? (templateProgress.current / templateProgress.total) * 100 : 0}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {templateProgress.current} / {templateProgress.total} {t('templates.stepsCompleted') || 'steps completed'}
              </p>
            </div>
          </div>
        )}

        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl">{t('templates.title')}</DialogTitle>
          <DialogDescription>
            {t('templates.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 py-4">
          <div className="grid grid-cols-2 gap-4 px-1">
            {WEBSITE_TEMPLATES.map((template) => (
              <motion.button
                key={template.id}
                onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
                className={cn(
                  "group relative rounded-xl border-2 p-4 text-left transition-all overflow-hidden",
                  selectedTemplate?.id === template.id
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground/50"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Theme Preview */}
                <div
                  className="h-32 rounded-lg mb-3 relative overflow-hidden"
                  style={{ backgroundColor: template.theme.background_color }}
                >
                  {/* Simulated blocks preview */}
                  <div className="absolute inset-0 p-3 flex flex-col gap-2">
                    {/* Hero preview */}
                    <div
                      className="h-12 rounded flex items-center justify-center"
                      style={{ backgroundColor: template.theme.secondary_color }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: template.theme.foreground_color }}
                      >
                        {template.name}
                      </span>
                    </div>
                    {/* Color pills */}
                    <div className="flex gap-1.5 mt-auto">
                      <div className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: template.theme.primary_color }} />
                      <div className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: template.theme.secondary_color }} />
                      <div className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: template.theme.accent_color }} />
                    </div>
                  </div>
                  {/* Selected indicator */}
                  {selectedTemplate?.id === template.id && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Template info */}
                <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {template.blocks.length} {t('templates.blocks')}
                  </span>
                  <span>•</span>
                  <span>{template.theme.font_heading}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={handleStartFromScratch}
              disabled={isApplyingTemplate}
            >
              <File className="h-4 w-4 mr-2" />
              {t('templates.startBlank')}
            </Button>
            <Button
              onClick={() => selectedTemplate && applyTemplate(selectedTemplate)}
              disabled={!selectedTemplate || isApplyingTemplate}
              className="min-w-[140px]"
            >
              {isApplyingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('templates.applying')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('templates.useTemplate')}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
