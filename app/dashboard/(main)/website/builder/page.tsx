'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Globe, ExternalLink, Palette, Layout, Image as ImageIcon, FileText, Settings, Loader2,
  Plus, Trash2, GripVertical, Clock, Phone, Instagram, Facebook, Twitter, Star,
  ChevronUp, ChevronDown, ChevronLeft, Monitor, Smartphone, Tablet, Edit,
  RefreshCw, PanelRightClose, PanelRight, UtensilsCrossed, Layers, Paintbrush, Check, Sparkles, File,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlockEditor } from '@/components/features/website-builder/BlockEditorComponents'
import { THEME_PRESETS, FONT_OPTIONS, BLOCK_TYPES, WEBSITE_TEMPLATES, type WebsiteTemplate } from '@/lib/constants/website'
import { getWebsiteUrl } from '@/utils/urls'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { LoadingPage } from '@/components/ui/loading-logo'
import { toast } from 'sonner'

// Types
type Website = {
  id: string
  tenant_id: string
  subdomain: string | null
  custom_domain: string | null
  is_published: boolean
  primary_color: string | null
  secondary_color: string | null
  background_color: string | null
  foreground_color: string | null
  accent_color: string | null
  font_heading: string | null
  font_body: string | null
  logo_url: string | null
  seo_title: string | null
  seo_description: string | null
  social_links: { facebook?: string; instagram?: string; twitter?: string; tiktok?: string }
}

type WebsitePage = { id: string; slug: string; title: string; is_published: boolean; is_in_navigation: boolean; sort_order: number }
type WebsiteBlock = { id: string; page_id: string; type: string; content: Record<string, unknown>; settings: { padding: string; background: string; alignment: string }; is_visible: boolean; sort_order: number }

export default function WebsiteBuilderPage() {
  const t = useTranslations('websiteBuilder')
  const queryClient = useQueryClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePanel, setActivePanel] = useState<'design' | 'pages' | 'blocks' | 'settings'>('design')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isAddPageOpen, setIsAddPageOpen] = useState(false)
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' })
  const [editingBlock, setEditingBlock] = useState<WebsiteBlock | null>(null)
  const [showAllThemes, setShowAllThemes] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [templateProgress, setTemplateProgress] = useState({ current: 0, total: 0, step: '' })
  
  // Local state for settings inputs (to prevent re-render on every keystroke)
  const [settingsForm, setSettingsForm] = useState({
    subdomain: '',
    seo_title: '',
    seo_description: '',
    facebook: '',
    instagram: '',
    twitter: '',
  })
  const [isSubdomainUpdating, setIsSubdomainUpdating] = useState(false)

  const { data: websiteData, isLoading } = useQuery({ queryKey: ['website'], queryFn: () => apiGet<{ data: { website: Website | null } }>('/website') })
  const { data: pagesData, isFetched: isPagesFetched } = useQuery({ queryKey: ['website-pages'], queryFn: () => apiGet<{ data: { pages: WebsitePage[] } }>('/website/pages') })
  const { data: blocksData, isFetched: isBlocksFetched } = useQuery({ queryKey: ['website-blocks', selectedPageId], queryFn: () => apiGet<{ data: { blocks: WebsiteBlock[] } }>(`/website/pages/${selectedPageId}/blocks`), enabled: !!selectedPageId })

  const website = websiteData?.data?.website
  const pages = pagesData?.data?.pages || []
  const blocks = blocksData?.data?.blocks || []

  // Debounced preview refresh using iframe reload (no unmount/remount flash)
  const refreshPreview = useCallback((immediate = false) => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
    const doRefresh = () => {
      try {
        iframeRef.current?.contentWindow?.location.reload()
      } catch {
        // Cross-origin fallback: update src to force reload
        if (iframeRef.current) {
          const currentSrc = iframeRef.current.src
          iframeRef.current.src = currentSrc
        }
      }
    }
    if (immediate) {
      doRefresh()
    } else {
      refreshTimeoutRef.current = setTimeout(doRefresh, 500) // 500ms debounce
    }
  }, [])

  // Cache structure types matching API response
  type WebsiteCache = { data: { website: Website | null } }
  type PagesCache = { data: { pages: WebsitePage[] } }
  type BlocksCache = { data: { blocks: WebsiteBlock[] } }

  // Optimistic update for website settings
  const updateWebsite = useMutation({
    mutationFn: (data: Partial<Website>) => apiPatch('/website', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website'] })
      const prev = queryClient.getQueryData<WebsiteCache>(['website'])
      queryClient.setQueryData<WebsiteCache>(['website'], (old) => old?.data?.website ? { data: { website: { ...old.data.website, ...data } } } : old)
      return { prev }
    },
    onError: (error: Error, data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website'], ctx.prev)
      // Reset form field if subdomain update failed
      if (data.subdomain && ctx?.prev?.data?.website?.subdomain) {
        setSettingsForm(f => ({ ...f, subdomain: ctx.prev?.data?.website?.subdomain || '' }))
      }
      toast.error(error.message || 'Failed to update website settings')
    },
    onSuccess: () => {
      toast.success('Settings saved')
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website'] }); refreshPreview() },
  })

  // Optimistic update for creating page
  const createPage = useMutation({
    mutationFn: (data: { title: string; slug: string }) => apiPost('/website/pages', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website-pages'] })
      const prev = queryClient.getQueryData<PagesCache>(['website-pages'])
      const optimisticPage: WebsitePage = { id: `temp-${Date.now()}`, ...data, is_published: true, is_in_navigation: true, sort_order: (prev?.data?.pages?.length || 0) + 1 }
      queryClient.setQueryData<PagesCache>(['website-pages'], (old) => old ? { data: { pages: [...(old.data?.pages || []), optimisticPage] } } : { data: { pages: [optimisticPage] } })
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev) },
    onSuccess: () => { setIsAddPageOpen(false); setNewPageForm({ title: '', slug: '' }) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-pages'] }); refreshPreview() },
  })

  // Optimistic update for deleting page
  const deletePage = useMutation({
    mutationFn: (pageId: string) => apiDelete(`/website/pages/${pageId}`),
    onMutate: async (pageId) => {
      await queryClient.cancelQueries({ queryKey: ['website-pages'] })
      const prev = queryClient.getQueryData<PagesCache>(['website-pages'])
      queryClient.setQueryData<PagesCache>(['website-pages'], (old) => old?.data?.pages ? { data: { pages: old.data.pages.filter(p => p.id !== pageId) } } : old)
      if (selectedPageId === pageId) setSelectedPageId(null)
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-pages'] }); refreshPreview() },
  })

  // Toggle page publish status
  const togglePagePublish = useMutation({
    mutationFn: ({ pageId, is_published }: { pageId: string; is_published: boolean }) =>
      apiPatch(`/website/pages/${pageId}`, { is_published }),
    onMutate: async ({ pageId, is_published }) => {
      await queryClient.cancelQueries({ queryKey: ['website-pages'] })
      const prev = queryClient.getQueryData<PagesCache>(['website-pages'])
      queryClient.setQueryData<PagesCache>(['website-pages'], (old) =>
        old?.data?.pages ? { data: { pages: old.data.pages.map(p => p.id === pageId ? { ...p, is_published } : p) } } : old
      )
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-pages'] }); refreshPreview() },
  })

  // Optimistic update for creating block
  const createBlock = useMutation({
    mutationFn: (data: { page_id: string; type: string }) => apiPost(`/website/pages/${data.page_id}/blocks`, { type: data.type }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      const pageBlocks = prev?.data?.blocks || []
      const optimisticBlock: WebsiteBlock = { id: `temp-${Date.now()}`, page_id: data.page_id, type: data.type, content: {}, settings: { padding: 'medium', background: 'transparent', alignment: 'center' }, is_visible: true, sort_order: pageBlocks.length + 1 }
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) => ({ data: { blocks: [...(old?.data?.blocks || []), optimisticBlock] } }))
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev) },
    onSuccess: () => setIsAddBlockOpen(false),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] }); refreshPreview() },
  })

  // Optimistic update for updating block
  const updateBlock = useMutation({
    mutationFn: ({ blockId, ...data }: { blockId: string } & Partial<WebsiteBlock>) => apiPatch(`/website/blocks/${blockId}`, data),
    onMutate: async ({ blockId, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) => old?.data?.blocks ? { data: { blocks: old.data.blocks.map(b => b.id === blockId ? { ...b, ...data } : b) } } : old)
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev) },
    onSuccess: () => setEditingBlock(null),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] }); refreshPreview() },
  })

  // Optimistic update for deleting block
  const deleteBlock = useMutation({
    mutationFn: (blockId: string) => apiDelete(`/website/blocks/${blockId}`),
    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) => old?.data?.blocks ? { data: { blocks: old.data.blocks.filter(b => b.id !== blockId) } } : old)
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] }); refreshPreview() },
  })

  // Optimistic update for moving block
  const moveBlock = useMutation({
    mutationFn: ({ blockId, direction }: { blockId: string; direction: 'up' | 'down' }) => apiPatch(`/website/blocks/${blockId}/move`, { direction }),
    onMutate: async ({ blockId, direction }) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      if (!prev?.data?.blocks) return { prev }
      const blocks = [...prev.data.blocks]
      const idx = blocks.findIndex(b => b.id === blockId)
      if (idx === -1) return { prev }
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= blocks.length) return { prev }
      // Swap sort_order values
      const tempOrder = blocks[idx].sort_order
      blocks[idx] = { ...blocks[idx], sort_order: blocks[swapIdx].sort_order }
      blocks[swapIdx] = { ...blocks[swapIdx], sort_order: tempOrder }
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], { data: { blocks } })
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev) },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] }); refreshPreview() },
  })

  // Optimistic update for publish/unpublish
  const publishWebsite = useMutation({
    mutationFn: () => apiPatch('/website', { is_published: !website?.is_published }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['website'] })
      const prev = queryClient.getQueryData<WebsiteCache>(['website'])
      queryClient.setQueryData<WebsiteCache>(['website'], (old) => old?.data?.website ? { data: { website: { ...old.data.website, is_published: !old.data.website.is_published } } } : old)
      return { prev }
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website'], ctx.prev) },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['website'] }),
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (pages.length > 0 && !selectedPageId) setSelectedPageId(pages[0].id) }, [pages.length, selectedPageId])
  
  // Sync settings form with website data (only on initial load)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (website) {
      setSettingsForm({
        subdomain: website.subdomain || '',
        seo_title: website.seo_title || '',
        seo_description: website.seo_description || '',
        facebook: website.social_links?.facebook || '',
        instagram: website.social_links?.instagram || '',
        twitter: website.social_links?.twitter || '',
      })
    }
  }, [website?.id])
  
  // Show template modal only for new users (no website exists yet)
  useEffect(() => {
    if (!isLoading && !website) {
      setShowTemplateModal(true)
    }
  }, [isLoading, website])

  // Apply a template (theme + create page + blocks)
  const applyTemplate = async (template: WebsiteTemplate) => {
    setIsApplyingTemplate(true)
    const totalSteps = template.blocks.length + 2 // theme + page + blocks
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
        // Delete existing blocks on this page
        const existingBlocks = await apiGet<{ data: { blocks: { id: string }[] } }>(`/website/pages/${pageId}/blocks`)
        if (existingBlocks?.data?.blocks) {
          for (const block of existingBlocks.data.blocks) {
            await apiDelete(`/website/blocks/${block.id}`)
          }
        }
      } else {
        // Create new home page
        const pageResponse = await apiPost<{ data: { page: { id: string } } }>('/website/pages', { title: 'Home', slug: 'home' })
        pageId = pageResponse?.data?.page?.id
      }
      
      if (pageId) {
        // 3. Create blocks sequentially with progress
        for (let i = 0; i < template.blocks.length; i++) {
          const block = template.blocks[i]
          const blockLabel = BLOCK_TYPES.find(b => b.type === block.type)?.label || block.type
          setTemplateProgress({ 
            current: i + 2, 
            total: totalSteps, 
            step: `${t('templates.addingBlock') || 'Adding'} ${blockLabel}...` 
          })
          
          await apiPost(`/website/pages/${pageId}/blocks`, {
            type: block.type,
            content: block.content,
            settings: block.settings,
          })
        }
      }
      
      setTemplateProgress({ current: totalSteps, total: totalSteps, step: t('templates.finishing') || 'Finishing up...' })
      
      // 4. Invalidate queries and refresh
      await queryClient.invalidateQueries({ queryKey: ['website'] })
      await queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      if (pageId) {
        await queryClient.invalidateQueries({ queryKey: ['website-blocks', pageId] })
        setSelectedPageId(pageId)
      }
      
      setShowTemplateModal(false)
      setSelectedTemplate(null)
      refreshPreview(true)
    } catch (error) {
      console.error('Failed to apply template:', error)
      toast.error(t('templates.applyFailed') || 'Failed to apply template')
    } finally {
      setIsApplyingTemplate(false)
      setTemplateProgress({ current: 0, total: 0, step: '' })
    }
  }

  // Start from scratch - just close modal
  const startFromScratch = () => {
    setShowTemplateModal(false)
    setSelectedTemplate(null)
    setActivePanel('pages')
  }

  if (isLoading) return <LoadingPage message={t('loading') || 'Loading website builder...'} />

  // const websiteUrl = website?.subdomain ? (process.env.NODE_ENV === 'development' ? `http://localhost:3000/site/${website.subdomain}` : `https://${website.subdomain}.klopay.app`) : null
  const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px'
  const websiteUrl = getWebsiteUrl(website) + '?preview=true'

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Preview Area */}
      <div className={cn("flex-1 transition-all duration-300 flex items-center justify-center pt-[76px] pb-3 pl-3", sidebarOpen ? "pr-[440px]" : "pr-3")}>
        <div className="relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 w-full h-full" style={{ maxWidth: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px' }}>
          {websiteUrl ? (
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
              {!isSubdomainUpdating && ((isPagesFetched && pages.length === 0) || (isBlocksFetched && blocks.length === 0 && selectedPageId)) && (
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/95 to-zinc-800/95 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center max-w-md px-6">
                    <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">{t('emptyState.title')}</h2>
                    <p className="text-zinc-400 mb-8">{t('emptyState.description')}</p>
                    <div className="space-y-3">
                      <Button size="lg" onClick={() => setShowTemplateModal(true)} className="w-full text-base">
                        <Sparkles className="h-5 w-5 mr-2" />
                        {t('emptyState.chooseTemplate')}
                      </Button>
                      <Button variant="outline" size="lg" onClick={() => { setActivePanel('blocks'); setIsAddBlockOpen(true) }} className="w-full text-base border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                        <Plus className="h-5 w-5 mr-2" />
                        {t('emptyState.addBlockManually')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center"><Globe className="h-16 w-16 mx-auto mb-4 opacity-50" /><p>{t('setupSubdomain')}</p></div>
            </div>
          )}
        </div>
      </div>

      {/* Top Bar */}
      <motion.div 
        className="fixed top-3 left-3 right-3 h-16 z-50 flex items-center justify-between px-4 bg-background/95 backdrop-blur-xl  rounded-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1"><a href="/dashboard"><ChevronLeft className="h-4 w-4" />{t('exit')}</a></Button>
          <div><h1 className="font-semibold">{t('title')}</h1><p className="text-xs text-muted-foreground">{website?.subdomain || t('noSubdomain')}.klopay.app</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
              <motion.div key={mode} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", previewMode === mode && "bg-primary text-primary-foreground")} onClick={() => setPreviewMode(mode)}><Icon className="h-4 w-4" /></Button>
              </motion.div>
            ))}
          </div>
          <motion.div whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" onClick={() => refreshPreview(true)}><RefreshCw className="h-4 w-4" /></Button>
          </motion.div>
          {websiteUrl && <Button variant="ghost" size="icon" asChild><a href={websiteUrl} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>}
          <Badge variant={website?.is_published ? "default" : "secondary"} className="ml-2">{website?.is_published ? t('live') : t('draft')}</Badge>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => publishWebsite.mutate()} disabled={publishWebsite.isPending} size="sm" variant={website?.is_published ? "outline" : "default"}>
              {publishWebsite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : website?.is_published ? t('unpublish') : t('publish')}
            </Button>
          </motion.div>
          <Button variant="ghost" size="icon" className="ml-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
          </Button>
        </div>
      </motion.div>

      {/* Sidebar */}
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
        <div className="flex border-b rounded-t-xl overflow-hidden">
          {([['design', Paintbrush], ['pages', FileText], ['blocks', Layers], ['settings', Settings]] as const).map(([id, Icon], index, arr) => (
            <button 
              key={id} 
              onClick={() => setActivePanel(id)} 
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                activePanel === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />{t(`panels.${id}`)}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[calc(100vh-164px)]">
          <div className="p-4 space-y-6">
            {/* Design Panel */}
            {activePanel === 'design' && (<>
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('design.darkThemes')}</h3>
                <motion.div 
                  className="grid grid-cols-2 gap-2"
                  initial="initial"
                  animate="animate"
                  variants={staggerContainer}
                >
                  {THEME_PRESETS.filter(p => p.isDark).slice(0, showAllThemes ? undefined : 4).map((preset, index) => {
                    const isSelected = website?.primary_color === preset.primary &&
                      website?.background_color === preset.background &&
                      website?.accent_color === preset.accent
                    return (
                      <motion.div key={preset.name} variants={staggerItemScale} custom={index}>
                        <button
                          onClick={() => updateWebsite.mutate({ primary_color: preset.primary, secondary_color: preset.secondary, background_color: preset.background, foreground_color: preset.foreground, accent_color: preset.accent })}
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
                <h3 className="text-sm font-medium text-white">{t('design.lightThemes')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.filter(p => !p.isDark).slice(0, showAllThemes ? undefined : 4).map((preset) => {
                    const isSelected = website?.primary_color === preset.primary &&
                      website?.background_color === preset.background &&
                      website?.accent_color === preset.accent
                    return (
                      <button
                        key={preset.name}
                        onClick={() => updateWebsite.mutate({ primary_color: preset.primary, secondary_color: preset.secondary, background_color: preset.background, foreground_color: preset.foreground, accent_color: preset.accent })}
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
                  className="w-full text-xs text-zinc-400 hover:text-white py-1"
                >
                  {showAllThemes ? t('design.showLess') : t('design.viewAllThemes', { count: THEME_PRESETS.length })}
                </button>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('design.colors')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[['primary_color', 'primary'], ['secondary_color', 'secondary'], ['background_color', 'background'], ['foreground_color', 'text'], ['accent_color', 'accent']].map(([field, labelKey]) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-zinc-400">{t(`design.${labelKey}`)}</label>
                      <div className="flex gap-2">
                        <input type="color" value={website?.[field as keyof Website] as string || '#000'} onChange={(e) => updateWebsite.mutate({ [field]: e.target.value })} className="h-9 w-9 rounded border border-white/20 cursor-pointer bg-transparent" />
                        <Input value={website?.[field as keyof Website] as string || ''} onChange={(e) => updateWebsite.mutate({ [field]: e.target.value })} className="flex-1 h-9 text-xs font-mono bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('design.typography')}</h3>
                {['font_heading', 'font_body'].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-zinc-400">{t(`design.${field === 'font_heading' ? 'heading' : 'body'}`)}</label>
                    <Select value={website?.[field as keyof Website] as string || 'Inter'} onValueChange={(v) => updateWebsite.mutate({ [field]: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('design.logo')}</h3>
                <Input value={website?.logo_url || ''} onChange={(e) => updateWebsite.mutate({ logo_url: e.target.value })} placeholder="https://..." className="bg-white/5 border-white/10 text-white text-sm" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {website?.logo_url && <div className="p-3 rounded-lg bg-white/5 border border-white/10"><img src={website.logo_url} alt="Logo" className="max-h-12 object-contain" /></div>}
              </div>
            </>)}

            {/* Pages Panel */}
            {activePanel === 'pages' && (<>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">{t('pages.title')}</h3>
                <Button size="sm" onClick={() => setIsAddPageOpen(true)} className="bg-white/10 hover:bg-white/20 text-white border-0"><Plus className="h-4 w-4 mr-1" />{t('pages.add')}</Button>
              </div>
              <p className="text-xs text-zinc-500">{t('pages.clickToPublish')}</p>
              <div className="space-y-2">
                {pages.map((page) => (
                  <div key={page.id} className={cn("p-3 rounded-lg border transition-colors cursor-pointer", selectedPageId === page.id ? "border-blue-500/50 bg-blue-500/10" : "border-white/10 bg-white/5 hover:bg-white/10")} onClick={() => { setSelectedPageId(page.id); setActivePanel('blocks') }}>
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-white font-medium">{page.title}</p><p className="text-xs text-zinc-500">/{page.slug}</p></div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePagePublish.mutate({ pageId: page.id, is_published: !page.is_published }) }}
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full border transition-all hover:scale-105",
                            page.is_published
                              ? "border-green-500/50 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "border-zinc-500/50 bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30 hover:border-green-500/50 hover:text-green-400"
                          )}
                          title={page.is_published ? t('pages.clickToUnpublish') : t('pages.clickToPublishPage')}
                        >
                          {page.is_published ? t('pages.liveStatus') : t('pages.draftStatus')}
                        </button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deletePage.mutate(page.id) }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {/* Blocks Panel */}
            {activePanel === 'blocks' && (<>
              <div className="flex items-center justify-between">
                <Select value={selectedPageId || ''} onValueChange={setSelectedPageId}>
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder={t('blocks.selectPage')} /></SelectTrigger>
                  <SelectContent>{pages.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" onClick={() => setIsAddBlockOpen(true)} disabled={!selectedPageId} className="bg-white/10 hover:bg-white/20 text-white border-0"><Plus className="h-4 w-4 mr-1" />{t('blocks.add')}</Button>
              </div>
              <div className="space-y-2">
                {blocks.sort((a, b) => a.sort_order - b.sort_order).map((block, idx) => {
                  const bt = BLOCK_TYPES.find(b => b.type === block.type)
                  const Icon = bt?.icon || Layout
                  return (
                    <div key={block.id} className={cn("p-3 rounded-lg border border-white/10 bg-white/5", !block.is_visible && "opacity-50")}>
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-zinc-600 cursor-grab" />
                        <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center"><Icon className="h-4 w-4 text-blue-400" /></div>
                        <p className="flex-1 text-sm text-white font-medium truncate">{bt?.label}</p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10" onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'up' })} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10" onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'down' })} disabled={idx === blocks.length - 1}><ChevronDown className="h-3 w-3" /></Button>
                          <Switch checked={block.is_visible} onCheckedChange={(v) => updateBlock.mutate({ blockId: block.id, is_visible: v })} className="scale-75" />
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-white" onClick={() => setEditingBlock(block)}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-red-400" onClick={() => deleteBlock.mutate(block.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {((isPagesFetched && pages.length === 0) || (isBlocksFetched && blocks.length === 0 && selectedPageId)) && (
                  <div className="text-center py-8 px-4">
                    <div className="h-14 w-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{t('emptyState.title')}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{t('emptyState.description')}</p>
                    <div className="space-y-2">
                      <Button onClick={() => setShowTemplateModal(true)} className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('emptyState.chooseTemplate')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsAddBlockOpen(true)} className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <Plus className="h-4 w-4 mr-1" />
                        {t('emptyState.addBlockManually')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>)}

            {/* Settings Panel */}
            {activePanel === 'settings' && (<>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('settings.domain')}</h3>
                <div className="flex gap-2">
                  <Input 
                    value={settingsForm.subdomain} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    onBlur={() => {
                      if (settingsForm.subdomain && settingsForm.subdomain !== (website?.subdomain || '')) {
                        setIsSubdomainUpdating(true)
                        updateWebsite.mutate({ subdomain: settingsForm.subdomain }, {
                          onSettled: () => {
                            // Add delay to let iframe reload with new URL
                            setTimeout(() => setIsSubdomainUpdating(false), 1500)
                          }
                        })
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white" 
                  />
                  <span className="flex items-center text-xs text-zinc-500">.klopay.app</span>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('settings.seo')}</h3>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">{t('settings.seoTitle')}</label>
                  <Input 
                    value={settingsForm.seo_title} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, seo_title: e.target.value }))}
                    onBlur={() => {
                      if (settingsForm.seo_title !== (website?.seo_title || '')) {
                        updateWebsite.mutate({ seo_title: settingsForm.seo_title })
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white text-sm" 
                    maxLength={60} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">{t('settings.seoDescription')}</label>
                  <Textarea 
                    value={settingsForm.seo_description} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, seo_description: e.target.value }))}
                    onBlur={() => {
                      if (settingsForm.seo_description !== (website?.seo_description || '')) {
                        updateWebsite.mutate({ seo_description: settingsForm.seo_description })
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white text-sm resize-none" 
                    rows={3} 
                    maxLength={160} 
                  />
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">{t('settings.socialLinks')}</h3>
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-zinc-500" />
                  <Input 
                    value={settingsForm.facebook} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, facebook: e.target.value }))}
                    onBlur={() => {
                      if (settingsForm.facebook !== (website?.social_links?.facebook || '')) {
                        updateWebsite.mutate({ social_links: { ...website?.social_links, facebook: settingsForm.facebook } })
                      }
                    }}
                    placeholder="facebook.com/..." 
                    className="bg-white/5 border-white/10 text-white text-sm" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-zinc-500" />
                  <Input 
                    value={settingsForm.instagram} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, instagram: e.target.value }))}
                    onBlur={() => {
                      if (settingsForm.instagram !== (website?.social_links?.instagram || '')) {
                        updateWebsite.mutate({ social_links: { ...website?.social_links, instagram: settingsForm.instagram } })
                      }
                    }}
                    placeholder="instagram.com/..." 
                    className="bg-white/5 border-white/10 text-white text-sm" 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-zinc-500" />
                  <Input 
                    value={settingsForm.twitter} 
                    onChange={(e) => setSettingsForm(f => ({ ...f, twitter: e.target.value }))}
                    onBlur={() => {
                      if (settingsForm.twitter !== (website?.social_links?.twitter || '')) {
                        updateWebsite.mutate({ social_links: { ...website?.social_links, twitter: settingsForm.twitter } })
                      }
                    }}
                    placeholder="twitter.com/..." 
                    className="bg-white/5 border-white/10 text-white text-sm" 
                  />
                </div>
              </div>
            </>)}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Add Page Dialog */}
      <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>{t('pages.createPage')}</DialogTitle><DialogDescription className="text-zinc-400">{t('pages.addNewPage')}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-zinc-300">{t('pages.pageTitle')}</Label><Input value={newPageForm.title} onChange={(e) => setNewPageForm({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div className="space-y-2"><Label className="text-zinc-300">{t('pages.slug')}</Label><Input value={newPageForm.slug} onChange={(e) => setNewPageForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPageOpen(false)} className="border-zinc-700 text-zinc-300">{t('pages.cancel')}</Button>
            <Button onClick={() => createPage.mutate(newPageForm)} disabled={createPage.isPending || !newPageForm.title}>{createPage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t('pages.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{t('blocks.addBlockDialog')}</DialogTitle><DialogDescription className="text-zinc-400">{t('blocks.chooseBlockType')}</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {BLOCK_TYPES.map((bt) => {
              const Icon = bt.icon
              return (
                <button key={bt.type} onClick={() => selectedPageId && createBlock.mutate({ page_id: selectedPageId, type: bt.type })} className="flex items-start gap-3 p-4 rounded-lg border border-zinc-800 hover:border-blue-500/50 hover:bg-blue-500/10 text-left">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Icon className="h-5 w-5 text-blue-400" /></div>
                  <div><p className="font-medium text-white">{bt.label}</p><p className="text-sm text-zinc-500">{bt.description}</p></div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(o) => !o && setEditingBlock(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('blocks.editBlock')}</DialogTitle>
            <DialogDescription className="text-zinc-400">{t('blocks.customizeContent')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {editingBlock && <BlockEditor block={editingBlock} onSave={(content) => updateBlock.mutate({ blockId: editingBlock.id, content })} isPending={updateBlock.isPending} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Modal */}
      <Dialog open={showTemplateModal} onOpenChange={(open) => { if (!isApplyingTemplate) setShowTemplateModal(open) }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Loading overlay when applying template */}
          {isApplyingTemplate && (
            <div className="absolute inset-0 bg-zinc-900/98 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center max-w-sm px-6">
                <div className="h-20 w-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t('templates.buildingWebsite') || 'Building your website...'}
                </h3>
                <p className="text-zinc-400 mb-6 text-sm">{templateProgress.step}</p>
                
                {/* Progress bar */}
                <div className="w-full bg-zinc-800 rounded-full h-2 mb-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${templateProgress.total > 0 ? (templateProgress.current / templateProgress.total) * 100 : 0}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {templateProgress.current} / {templateProgress.total} {t('templates.stepsCompleted') || 'steps completed'}
                </p>
              </div>
            </div>
          )}
          
          <DialogHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl">{t('templates.title')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
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
                      ? "border-blue-500 ring-2 ring-blue-500/30"
                      : "border-zinc-700 hover:border-zinc-600"
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
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Template info */}
                  <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
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

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={startFromScratch}
                disabled={isApplyingTemplate}
                className="text-zinc-400 hover:text-white"
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
    </div>
  )
}
