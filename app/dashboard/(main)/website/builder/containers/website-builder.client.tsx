'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TopBarContainer } from './top-bar.container'
import { PreviewAndEditorContainer, type Website, type WebsitePage } from './preview-and-editor.'
import { TemplateSelectionContainer } from './template-selection.container'

type WebsiteBuilderClientProps = {
  initialWebsite: Website | null
  initialPages: WebsitePage[]
}

export function WebsiteBuilderClient({
  initialWebsite,
  initialPages,
}: WebsiteBuilderClientProps) {
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

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      <TopBarContainer
        website={website}
        previewMode={previewMode}
        sidebarOpen={sidebarOpen}
        setPreviewMode={setPreviewMode}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Preview and Editor Feature */}
      <PreviewAndEditorContainer
        website={website}
        initialPages={initialPages}
        sidebarOpen={sidebarOpen}
        previewMode={previewMode}
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
  )
}
