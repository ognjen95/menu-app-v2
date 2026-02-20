'use client'

import { lazy, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Paintbrush, FileText, Layers, Settings, Loader2, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from '@/components/ui/animated'
import { BlockEditor } from '@/features/website-builder/BlockEditorComponents'
import { PageTranslationEditor } from '@/features/website-builder/PageTranslationEditor'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { BLOCK_TYPES } from '@/lib/constants/website'

// Lazy load tab components
const DesignPanel = lazy(() => import('./design-panel'))
const PagesPanel = lazy(() => import('./pages-panel'))
const BlocksPanel = lazy(() => import('./blocks-panel'))
const SettingsPanel = lazy(() => import('./settings-panel'))

// Types
type Website = {
  id: string
  subdomain?: string | null
  seo_title?: string | null
  seo_description?: string | null
  social_links?: { facebook?: string; instagram?: string; twitter?: string; tiktok?: string }
  primary_color?: string | null
  secondary_color?: string | null
  background_color?: string | null
  foreground_color?: string | null
  accent_color?: string | null
  font_heading?: string | null
  font_body?: string | null
  logo_url?: string | null
  [key: string]: unknown
}

type WebsitePage = {
  id: string
  slug: string
  title: string
  is_published: boolean
  is_in_navigation: boolean
  sort_order: number
}

type WebsiteBlock = {
  id: string
  page_id: string
  type: string
  content: Record<string, unknown>
  settings: { padding: string; background: string; alignment: string }
  is_visible: boolean
  sort_order: number
}

type SidebarProps = {
  sidebarOpen: boolean
  activePanel: 'design' | 'pages' | 'blocks' | 'settings'
  setActivePanel: (panel: 'design' | 'pages' | 'blocks' | 'settings') => void
  // Data
  website: Website | null | undefined
  pages: WebsitePage[]
  blocks: WebsiteBlock[]
  selectedPageId: string | null
  isPagesFetched: boolean
  isBlocksFetched: boolean
  // Page editing state
  isAddPageOpen: boolean
  setIsAddPageOpen: (open: boolean) => void
  newPageForm: { title: string; slug: string }
  setNewPageForm: React.Dispatch<React.SetStateAction<{ title: string; slug: string }>>
  editingPageTranslation: WebsitePage | null
  setEditingPageTranslation: (page: WebsitePage | null) => void
  deletePageConfirm: { page: WebsitePage; blocksCount: number } | null
  setDeletePageConfirm: (data: { page: WebsitePage; blocksCount: number } | null) => void
  // Block editing state
  isAddBlockOpen: boolean
  setIsAddBlockOpen: (open: boolean) => void
  editingBlock: WebsiteBlock | null
  setEditingBlock: (block: WebsiteBlock | null) => void
  deleteBlockConfirm: WebsiteBlock | null
  setDeleteBlockConfirm: (block: WebsiteBlock | null) => void
  // Mutations
  updateWebsite: { mutate: (data: Partial<Website>, options?: { onSettled?: () => void }) => void }
  createPage: { mutate: (data: { title: string; slug: string }) => void; isPending: boolean }
  deletePage: { mutate: (pageId: string) => void; isPending: boolean }
  togglePagePublish: { mutate: (data: { pageId: string; is_published: boolean }) => void }
  createBlock: { mutate: (data: { page_id: string; type: string }) => void }
  updateBlock: { mutate: (data: { blockId: string; content?: Record<string, unknown>; is_visible?: boolean }) => void; isPending: boolean }
  deleteBlock: { mutate: (blockId: string) => void; isPending: boolean }
  moveBlock: { mutate: (data: { blockId: string; direction: 'up' | 'down' }) => void }
  // Handlers
  setSelectedPageId: (id: string) => void
  setIsSubdomainUpdating: (updating: boolean) => void
  setShowTemplateModal: (show: boolean) => void
  fetchBlocksCount: (pageId: string) => Promise<number>
  refreshPreview: () => void
}

export function Sidebar({
  sidebarOpen,
  activePanel,
  setActivePanel,
  // Data
  website,
  pages,
  blocks,
  selectedPageId,
  isPagesFetched,
  isBlocksFetched,
  // Page editing state
  isAddPageOpen,
  setIsAddPageOpen,
  newPageForm,
  setNewPageForm,
  editingPageTranslation,
  setEditingPageTranslation,
  deletePageConfirm,
  setDeletePageConfirm,
  // Block editing state
  isAddBlockOpen,
  setIsAddBlockOpen,
  editingBlock,
  setEditingBlock,
  deleteBlockConfirm,
  setDeleteBlockConfirm,
  // Mutations
  updateWebsite,
  createPage,
  deletePage,
  togglePagePublish,
  createBlock,
  updateBlock,
  deleteBlock,
  moveBlock,
  // Handlers
  setSelectedPageId,
  setIsSubdomainUpdating,
  setShowTemplateModal,
  fetchBlocksCount,
  refreshPreview,
}: SidebarProps) {
  const t = useTranslations('websiteBuilder')

  // Props for each panel
  const designPanelProps = { website, updateWebsite }
  const pagesPanelProps = {
    pages,
    selectedPageId,
    setSelectedPageId,
    setActivePanel,
    setIsAddPageOpen,
    setEditingPageTranslation,
    setDeletePageConfirm,
    togglePagePublish,
    fetchBlocksCount,
  }
  const blocksPanelProps = {
    pages,
    blocks,
    selectedPageId,
    isPagesFetched,
    isBlocksFetched,
    setSelectedPageId,
    setIsAddBlockOpen,
    setEditingBlock,
    setDeleteBlockConfirm,
    setShowTemplateModal,
    moveBlock,
    updateBlock,
  }
  const settingsPanelProps = { website, updateWebsite, setIsSubdomainUpdating }

  const tabs = [
    { id: 'design' as const, icon: Paintbrush },
    { id: 'pages' as const, icon: FileText },
    { id: 'blocks' as const, icon: Layers },
    { id: 'settings' as const, icon: Settings },
  ]

  return (
    <motion.div 
      className={cn(
        "fixed top-[76px] right-3 bottom-3 w-[420px] transition-transform duration-300 z-40 rounded-xl border",
        "bg-gradient-to-b from-white to-white shadow-lg shadow-black/5",
        "dark:from-white/[0.08] dark:to-white/[0.03] dark:shadow-none dark:backdrop-blur-sm dark:border-white/[0.1]",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}
      initial={{ x: 440 }}
      animate={{ x: sidebarOpen ? 0 : 440 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tab Navigation */}
      <div className="flex border-b rounded-t-xl overflow-hidden">
        {tabs.map(({ id, icon: Icon }) => (
          <button 
            key={id} 
            onClick={() => setActivePanel(id)} 
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
              activePanel === id 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            {t(`panels.${id}`)}
          </button>
        ))}
      </div>

      {/* Tab Content with Lazy Loading */}
      <ScrollArea className="h-[calc(100vh-164px)]">
        <div className="p-4 space-y-6">
          <Suspense fallback={<LoadingPanel />}>
            {activePanel === 'design' && <DesignPanel {...designPanelProps} />}
            {activePanel === 'pages' && <PagesPanel {...pagesPanelProps} />}
            {activePanel === 'blocks' && <BlocksPanel {...blocksPanelProps} />}
            {activePanel === 'settings' && <SettingsPanel {...settingsPanelProps} />}
          </Suspense>
        </div>
      </ScrollArea>

      {/* Add Page Dialog */}
      <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.createPage')}</DialogTitle>
            <DialogDescription>{t('pages.addNewPage')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('pages.pageTitle')}</Label>
              <Input
                value={newPageForm.title}
                onChange={(e) => setNewPageForm({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('pages.slug')}</Label>
              <Input
                value={newPageForm.slug}
                onChange={(e) => setNewPageForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPageOpen(false)}>
              {t('pages.cancel')}
            </Button>
            <Button onClick={() => createPage.mutate(newPageForm)} disabled={createPage.isPending || !newPageForm.title}>
              {createPage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('pages.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('blocks.addBlockDialog')}</DialogTitle>
            <DialogDescription>{t('blocks.chooseBlockType')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon
              return (
                <button
                  key={bt.type}
                  onClick={() => selectedPageId && createBlock.mutate({ page_id: selectedPageId, type: bt.type })}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/10 text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{bt.label}</p>
                    <p className="text-sm text-muted-foreground">{bt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(o) => !o && setEditingBlock(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('blocks.editBlock')}</DialogTitle>
            <DialogDescription>{t('blocks.customizeContent')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {editingBlock && (
              <BlockEditor
                block={editingBlock}
                onSave={(content) => updateBlock.mutate({ blockId: editingBlock.id, content })}
                isPending={updateBlock.isPending}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Page Translation Dialog */}
      <Dialog open={!!editingPageTranslation} onOpenChange={(o) => !o && setEditingPageTranslation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('pages.translatePageTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('pages.translatePageDescription', { title: editingPageTranslation?.title || '' })}
            </DialogDescription>
          </DialogHeader>
          {editingPageTranslation && (
            <PageTranslationEditor
              pageId={editingPageTranslation.id}
              pageTitle={editingPageTranslation.title}
              onSaved={() => { setEditingPageTranslation(null); refreshPreview() }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Page Confirmation */}
      <ConfirmDeleteDialog
        open={!!deletePageConfirm}
        onOpenChange={(open) => !open && setDeletePageConfirm(null)}
        title={t('pages.deletePage')}
        description={t('pages.deletePageDescription', { title: deletePageConfirm?.page.title || '' })}
        warningMessage={deletePageConfirm?.blocksCount ? t('pages.deletePageWarning', { count: deletePageConfirm.blocksCount }) : undefined}
        onConfirm={() => {
          if (deletePageConfirm) {
            deletePage.mutate(deletePageConfirm.page.id)
            setDeletePageConfirm(null)
          }
        }}
        isLoading={deletePage.isPending}
      />

      {/* Delete Block Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteBlockConfirm}
        onOpenChange={(open) => !open && setDeleteBlockConfirm(null)}
        title={t('blocks.deleteBlock')}
        description={t('blocks.deleteBlockDescription')}
        onConfirm={() => {
          if (deleteBlockConfirm) {
            deleteBlock.mutate(deleteBlockConfirm.id)
            setDeleteBlockConfirm(null)
          }
        }}
        isLoading={deleteBlock.isPending}
      />
    </motion.div>
  )
}

function LoadingPanel() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
