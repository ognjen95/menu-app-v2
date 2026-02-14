'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

type WebsitePage = {
  id: string
  slug: string
  title: string
  is_published: boolean
  is_in_navigation: boolean
  sort_order: number
}

type PagesPanelProps = {
  pages: WebsitePage[]
  selectedPageId: string | null
  setSelectedPageId: (id: string) => void
  setActivePanel: (panel: 'design' | 'pages' | 'blocks' | 'settings') => void
  setIsAddPageOpen: (open: boolean) => void
  setEditingPageTranslation: (page: WebsitePage | null) => void
  setDeletePageConfirm: (data: { page: WebsitePage; blocksCount: number } | null) => void
  togglePagePublish: { mutate: (data: { pageId: string; is_published: boolean }) => void }
  fetchBlocksCount: (pageId: string) => Promise<number>
}

export default function PagesPanel({
  pages,
  selectedPageId,
  setSelectedPageId,
  setActivePanel,
  setIsAddPageOpen,
  setEditingPageTranslation,
  setDeletePageConfirm,
  togglePagePublish,
  fetchBlocksCount,
}: PagesPanelProps) {
  const t = useTranslations('websiteBuilder')

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{t('pages.title')}</h3>
        <Button 
          size="sm" 
          onClick={() => setIsAddPageOpen(true)} 
          className="bg-primary/10 hover:bg-primary/20 text-primary border-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('pages.add')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t('pages.clickToPublish')}</p>
      <div className="space-y-2">
        {pages.map((page) => (
          <div 
            key={page.id} 
            className={cn(
              "p-3 rounded-lg transition-colors cursor-pointer",
              selectedPageId === page.id 
                ? "border-primary/50 bg-primary/10" 
                : "border-border bg-muted/50 hover:bg-muted"
            )} 
            onClick={() => { 
              setSelectedPageId(page.id)
              setActivePanel('blocks') 
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { 
                    e.stopPropagation()
                    togglePagePublish.mutate({ pageId: page.id, is_published: !page.is_published }) 
                  }}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full border transition-all hover:scale-105",
                    page.is_published
                      ? "border-green-500/50 bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground hover:bg-muted/80 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400"
                  )}
                  title={page.is_published ? t('pages.clickToUnpublish') : t('pages.clickToPublishPage')}
                >
                  {page.is_published ? t('pages.liveStatus') : t('pages.draftStatus')}
                </button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-primary" 
                  onClick={(e) => { 
                    e.stopPropagation()
                    setEditingPageTranslation(page) 
                  }} 
                  title={t('pages.translateTitle')}
                >
                  <Languages className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive" 
                  onClick={async (e) => { 
                    e.stopPropagation()
                    const blocksCount = await fetchBlocksCount(page.id)
                    setDeletePageConfirm({ page, blocksCount })
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
