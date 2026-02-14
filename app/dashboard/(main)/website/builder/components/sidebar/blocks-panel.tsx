'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit, ChevronUp, ChevronDown, GripVertical, Layout, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_TYPES } from '@/lib/constants/website'

type WebsitePage = {
  id: string
  slug: string
  title: string
  is_published: boolean
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

type BlocksPanelProps = {
  pages: WebsitePage[]
  blocks: WebsiteBlock[]
  selectedPageId: string | null
  isPagesFetched: boolean
  isBlocksFetched: boolean
  setSelectedPageId: (id: string) => void
  setIsAddBlockOpen: (open: boolean) => void
  setEditingBlock: (block: WebsiteBlock | null) => void
  setDeleteBlockConfirm: (block: WebsiteBlock | null) => void
  setShowTemplateModal: (show: boolean) => void
  moveBlock: { mutate: (data: { blockId: string; direction: 'up' | 'down' }) => void }
  updateBlock: { mutate: (data: { blockId: string; is_visible?: boolean; content?: Record<string, unknown> }) => void }
}

export default function BlocksPanel({
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
}: BlocksPanelProps) {
  const t = useTranslations('websiteBuilder')

  const selectedPage = pages.find(p => p.id === selectedPageId)
  const isHomePage = !selectedPage || selectedPage.slug === 'home' || selectedPage.slug === '' || pages.indexOf(selectedPage) === 0

  return (
    <>
      <div className="flex items-center justify-between">
        <Select value={selectedPageId || ''} onValueChange={setSelectedPageId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('blocks.selectPage')} />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          size="sm" 
          onClick={() => setIsAddBlockOpen(true)} 
          disabled={!selectedPageId} 
          className="bg-primary/10 hover:bg-primary/20 text-primary border-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('blocks.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.sort((a, b) => a.sort_order - b.sort_order).map((block, idx) => {
          const bt = BLOCK_TYPES.find(b => b.type === block.type)
          const Icon = bt?.icon || Layout
          return (
            <div key={block.id} className={cn("p-3 rounded-lg bg-muted/50 border border-border", !block.is_visible && "opacity-50")}>
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <p className="flex-1 text-sm text-foreground font-medium truncate">{bt?.label}</p>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" 
                    onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'up' })} 
                    disabled={idx === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" 
                    onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'down' })} 
                    disabled={idx === blocks.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Switch 
                    checked={block.is_visible} 
                    onCheckedChange={(v) => updateBlock.mutate({ blockId: block.id, is_visible: v })} 
                    className="scale-75" 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                    onClick={() => setEditingBlock(block)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive" 
                    onClick={() => setDeleteBlockConfirm(block)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {((isPagesFetched && pages.length === 0) || (isBlocksFetched && blocks.length === 0 && selectedPageId)) && (
          <div className="text-center py-8 px-4">
            <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              {isHomePage ? <Sparkles className="h-7 w-7 text-blue-400" /> : <Plus className="h-7 w-7 text-blue-400" />}
            </div>
            <h3 className="text-foreground font-semibold mb-2">
              {isHomePage ? t('emptyState.title') : t('emptyState.addBlocksTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isHomePage ? t('emptyState.description') : t('emptyState.addBlocksDescription')}
            </p>
            <div className="space-y-2">
              {isHomePage && (
                <Button onClick={() => setShowTemplateModal(true)} className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('emptyState.chooseTemplate')}
                </Button>
              )}
              <Button 
                variant={isHomePage ? "outline" : "default"} 
                size="sm" 
                onClick={() => setIsAddBlockOpen(true)} 
                className={isHomePage ? "w-full" : "w-full"}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('emptyState.addBlockManually')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
