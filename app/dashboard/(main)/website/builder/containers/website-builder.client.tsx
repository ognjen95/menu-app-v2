'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { TopBarContainer } from './top-bar.container'
import { PreviewAndEditorContainer, type Website, type WebsitePage } from './preview-and-editor.'
import { TemplateSelectionContainer } from './template-selection.container'
import type { PreviewTarget } from '../components/top-bar'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type WebsiteBuilderClientProps = {
  initialWebsite: Website | null
  initialPages: WebsitePage[]
}

export function WebsiteBuilderClient({
  initialWebsite,
  initialPages,
}: WebsiteBuilderClientProps) {
  const t = useTranslations('websiteBuilder')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  // Hydrate initial data into query cache
  useEffect(() => {
    if (initialWebsite !== undefined) {
      queryClient.setQueryData(['website'], { data: { website: initialWebsite } })
    }
    if (initialPages) {
      queryClient.setQueryData(['website-pages'], { data: { pages: initialPages } })
    }
  }, [initialWebsite, initialPages, queryClient])

  // Layout/UI state
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePanel, setActivePanel] = useState<'design' | 'pages' | 'blocks' | 'settings'>('design')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>('website')
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(!initialWebsite)

  // Use cached data (will be hydrated from server)
  const websiteData = queryClient.getQueryData<{ data: { website: Website | null } }>(['website'])
  const pagesData = queryClient.getQueryData<{ data: { pages: WebsitePage[] } }>(['website-pages'])

  const website = websiteData?.data?.website ?? initialWebsite
  const pages = useMemo(() => pagesData?.data?.pages ?? initialPages ?? [], [pagesData?.data?.pages, initialPages])

  // Start from scratch callback
  const handleStartFromScratch = useCallback(() => {
    setActivePanel('pages')
  }, [])

  // Handle preview target change - auto-switch to mobile for menu
  const handlePreviewTargetChange = useCallback((target: PreviewTarget) => {
    setPreviewTarget(target)
    if (target === 'menu') {
      setPreviewMode('mobile')
    }
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 flex overflow-hidden">
        <TopBarContainer
          website={website}
          previewMode={previewMode}
          previewTarget={previewTarget}
          sidebarOpen={sidebarOpen}
          setPreviewMode={setPreviewMode}
          setPreviewTarget={handlePreviewTargetChange}
          setSidebarOpen={setSidebarOpen}
        />
        {website && !website.is_published && isAlertVisible && (
          <div className="fixed top-0 left-0 right-0 z-[9999999] px-4 pt-4 pb-0">
            <Alert variant="warning" className='backdrop-blur-xl relative flex items-center justify-between'>
              <AlertCircle className="h-4 w-4" />
              <div>
                <AlertTitle>{t('unpublished.title')}</AlertTitle>
                <AlertDescription>{t('unpublished.description')}</AlertDescription>
              </div>
              <Button
                variant="ghost"
                size={'sm'}
                onClick={() => setIsAlertVisible(false)}
              >
                {tCommon('close')}
              </Button>
            </Alert>
          </div>
        )}

        {/* Preview and Editor Feature */}
        <PreviewAndEditorContainer
          website={website}
          initialPages={initialPages}
          sidebarOpen={sidebarOpen}
          previewMode={previewMode}
          previewTarget={previewTarget}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          setShowTemplateModal={setShowTemplateModal}
        />

        {/* Template Selection Modal */}
        <TemplateSelectionContainer
          open={showTemplateModal}
          onOpenChange={setShowTemplateModal}
          pages={pages}
          onStartFromScratch={handleStartFromScratch}
        />
      </div>
    </div>
  )
}
