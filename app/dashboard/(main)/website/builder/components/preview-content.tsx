'use client'

import { RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Globe, Loader2, Sparkles, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Page = {
  id: string
  slug: string
  [key: string]: unknown
}

type PreviewContentProps = {
  websiteUrl: string | null
  iframeRef: RefObject<HTMLIFrameElement>
  isSubdomainUpdating: boolean
  isPagesFetched: boolean
  isBlocksFetched: boolean
  pages: Page[]
  blocks: unknown[]
  selectedPageId: string | null
  previewMode: 'desktop' | 'tablet' | 'mobile'
  sidebarOpen: boolean
  setShowTemplateModal: (show: boolean) => void
  setActivePanel: (panel: 'design' | 'pages' | 'blocks' | 'settings') => void
  setIsAddBlockOpen: (open: boolean) => void
}

export function PreviewContent({
  websiteUrl,
  iframeRef,
  isSubdomainUpdating,
  isPagesFetched,
  isBlocksFetched,
  pages,
  blocks,
  selectedPageId,
  previewMode,
  sidebarOpen,
  setShowTemplateModal,
  setActivePanel,
  setIsAddBlockOpen,
}: PreviewContentProps) {
  const t = useTranslations('websiteBuilder')

  return (
    <div className={cn("flex-1 transition-all duration-300 flex items-center justify-center pt-[76px] pb-3 pl-3", sidebarOpen ? "pr-[440px]" : "pr-3")}>
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full h-full" style={{ maxWidth: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px' }}>
        {!websiteUrl ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t('setupSubdomain')}</p>
            </div>
          </div>
        ) : (
          <>
            <iframe ref={iframeRef} src={websiteUrl} className="w-full h-full border-0" title="Preview" />
            
            {/* Loading overlay when subdomain is being updated */}
            {isSubdomainUpdating && (
              <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-white font-medium">{t('updatingDomain') || 'Updating domain...'}</p>
                </div>
              </div>
            )}
            
            {/* Empty state overlay when no pages OR no blocks - only show after queries finished */}
            {!isSubdomainUpdating && ((isPagesFetched && pages.length === 0) || (isBlocksFetched && blocks.length === 0 && selectedPageId)) && (() => {
              const selectedPage = pages.find(p => p.id === selectedPageId)
              const isHomePage = !selectedPage || selectedPage.slug === 'home' || selectedPage.slug === '' || pages.indexOf(selectedPage) === 0
              return (
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/95 to-zinc-800/95 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center max-w-md px-6">
                    <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                      {isHomePage ? <Sparkles className="h-10 w-10 text-white" /> : <Plus className="h-10 w-10 text-white" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">{isHomePage ? t('emptyState.title') : t('emptyState.addBlocksTitle')}</h2>
                    <p className="text-zinc-400 mb-8">{isHomePage ? t('emptyState.description') : t('emptyState.addBlocksDescription')}</p>
                    <div className="space-y-3">
                      {isHomePage && (
                        <Button size="lg" onClick={() => setShowTemplateModal(true)} className="w-full text-base">
                          <Sparkles className="h-5 w-5 mr-2" />
                          {t('emptyState.chooseTemplate')}
                        </Button>
                      )}
                      <Button variant={isHomePage ? "outline" : "default"} size="lg" onClick={() => { setActivePanel('blocks'); setIsAddBlockOpen(true) }} className={isHomePage ? "w-full text-base border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white" : "w-full text-base"}>
                        <Plus className="h-5 w-5 mr-2" />
                        {t('emptyState.addBlockManually')}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
