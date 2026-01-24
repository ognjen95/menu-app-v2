'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  RefreshCw, PanelRightClose, PanelRight, UtensilsCrossed, Layers, Paintbrush, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlockEditor } from '@/components/features/website-builder/BlockEditorComponents'
import { THEME_PRESETS, FONT_OPTIONS, BLOCK_TYPES } from '@/lib/constants/website'

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

  const { data: websiteData, isLoading } = useQuery({ queryKey: ['website'], queryFn: () => apiGet<{ data: { website: Website | null } }>('/website') })
  const { data: pagesData } = useQuery({ queryKey: ['website-pages'], queryFn: () => apiGet<{ data: { pages: WebsitePage[] } }>('/website/pages') })
  const { data: blocksData } = useQuery({ queryKey: ['website-blocks', selectedPageId], queryFn: () => apiGet<{ data: { blocks: WebsiteBlock[] } }>(`/website/pages/${selectedPageId}/blocks`), enabled: !!selectedPageId })

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
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['website'], ctx.prev) },
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

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-zinc-950"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>

  const websiteUrl = website?.subdomain ? (process.env.NODE_ENV === 'development' ? `http://localhost:3000/site/${website.subdomain}` : `https://${website.subdomain}.qrmenu.app`) : null
  const previewWidth = previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px'

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-zinc-950">
      {/* Preview Area */}
      <div className={cn("flex-1 transition-all duration-300 flex items-center justify-center p-4 pt-20", sidebarOpen ? "mr-[420px]" : "mr-0")}>
        <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-300" style={{ width: previewWidth, height: previewMode === 'mobile' ? '812px' : '100%', maxHeight: 'calc(100vh - 120px)' }}>
          {websiteUrl ? (
            <iframe ref={iframeRef} src={websiteUrl} className="w-full h-full border-0" title="Preview" />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <div className="text-center"><Globe className="h-16 w-16 mx-auto mb-4 opacity-50" /><p>Set up your subdomain</p></div>
            </div>
          )}
        </div>
      </div>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white hover:bg-white/10 gap-1"><a href="/dashboard/website"><ChevronLeft className="h-4 w-4" />Exit</a></Button>
          <div><h1 className="text-white font-semibold">Website Builder</h1><p className="text-xs text-zinc-400">{website?.subdomain || 'No subdomain'}.qrmenu.app</p></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
              <Button key={mode} variant="ghost" size="icon" className={cn("h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10", previewMode === mode && "bg-white/20 text-white")} onClick={() => setPreviewMode(mode)}><Icon className="h-4 w-4" /></Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => refreshPreview(true)}><RefreshCw className="h-4 w-4" /></Button>
          {websiteUrl && <Button variant="ghost" size="icon" asChild className="text-zinc-400 hover:text-white hover:bg-white/10"><a href={websiteUrl} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>}
          <Badge className={cn("ml-2", website?.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400")}>{website?.is_published ? 'Live' : 'Draft'}</Badge>
          <Button onClick={() => publishWebsite.mutate()} disabled={publishWebsite.isPending} size="sm" className={website?.is_published ? "bg-zinc-700 text-white" : "bg-green-600 text-white"}>
            {publishWebsite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : website?.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 ml-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Glass Sidebar */}
      <div className={cn("fixed top-16 right-0 bottom-0 w-[420px] transition-transform duration-300 z-40", sidebarOpen ? "translate-x-0" : "translate-x-full")} style={{ background: 'rgba(24,24,27,0.85)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex border-b border-white/10">
          {([['design', Paintbrush, 'Design'], ['pages', FileText, 'Pages'], ['blocks', Layers, 'Blocks'], ['settings', Settings, 'Settings']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => setActivePanel(id)} className={cn("flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors", activePanel === id ? "text-white bg-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[calc(100vh-112px)]">
          <div className="p-4 space-y-6">
            {/* Design Panel */}
            {activePanel === 'design' && (<>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Dark Themes</h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.filter(p => p.isDark).slice(0, showAllThemes ? undefined : 4).map((preset) => {
                    const isSelected = website?.primary_color === preset.primary && 
                                      website?.background_color === preset.background &&
                                      website?.accent_color === preset.accent
                    return (
                      <button 
                        key={preset.name} 
                        onClick={() => updateWebsite.mutate({ primary_color: preset.primary, secondary_color: preset.secondary, background_color: preset.background, foreground_color: preset.foreground, accent_color: preset.accent })} 
                        className={cn(
                          "p-2.5 rounded-lg border-2 text-left relative transition-all",
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
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Light Themes</h3>
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
                  {showAllThemes ? 'Show Less' : `View All ${THEME_PRESETS.length} Themes`}
                </button>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Colors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[['primary_color', 'Primary'], ['secondary_color', 'Secondary'], ['background_color', 'Background'], ['foreground_color', 'Text'], ['accent_color', 'Accent']].map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs text-zinc-400">{label}</label>
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
                <h3 className="text-sm font-medium text-white">Typography</h3>
                {['font_heading', 'font_body'].map((field) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs text-zinc-400">{field === 'font_heading' ? 'Heading' : 'Body'}</label>
                    <Select value={website?.[field as keyof Website] as string || 'Inter'} onValueChange={(v) => updateWebsite.mutate({ [field]: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Logo</h3>
                <Input value={website?.logo_url || ''} onChange={(e) => updateWebsite.mutate({ logo_url: e.target.value })} placeholder="https://..." className="bg-white/5 border-white/10 text-white text-sm" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {website?.logo_url && <div className="p-3 rounded-lg bg-white/5 border border-white/10"><img src={website.logo_url} alt="Logo" className="max-h-12 object-contain" /></div>}
              </div>
            </>)}

            {/* Pages Panel */}
            {activePanel === 'pages' && (<>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Pages</h3>
                <Button size="sm" onClick={() => setIsAddPageOpen(true)} className="bg-white/10 hover:bg-white/20 text-white border-0"><Plus className="h-4 w-4 mr-1" />Add</Button>
              </div>
              <p className="text-xs text-zinc-500">Click the status badge to publish/unpublish a page</p>
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
                          title={page.is_published ? "Click to unpublish" : "Click to publish"}
                        >
                          {page.is_published ? '● Live' : '○ Draft'}
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
                  <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select page" /></SelectTrigger>
                  <SelectContent>{pages.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" onClick={() => setIsAddBlockOpen(true)} disabled={!selectedPageId} className="bg-white/10 hover:bg-white/20 text-white border-0"><Plus className="h-4 w-4 mr-1" />Add</Button>
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
                {blocks.length === 0 && selectedPageId && (
                  <div className="text-center py-8 text-zinc-500"><Layers className="h-10 w-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No blocks</p><Button size="sm" onClick={() => setIsAddBlockOpen(true)} className="mt-3 bg-white/10 text-white border-0"><Plus className="h-4 w-4 mr-1" />Add Block</Button></div>
                )}
              </div>
            </>)}

            {/* Settings Panel */}
            {activePanel === 'settings' && (<>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Domain</h3>
                <div className="flex gap-2">
                  <Input value={website?.subdomain || ''} onChange={(e) => updateWebsite.mutate({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="bg-white/5 border-white/10 text-white" />
                  <span className="flex items-center text-xs text-zinc-500">.qrmenu.app</span>
                </div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">SEO</h3>
                <div className="space-y-1"><label className="text-xs text-zinc-400">Title</label><Input value={website?.seo_title || ''} onChange={(e) => updateWebsite.mutate({ seo_title: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm" maxLength={60} /></div>
                <div className="space-y-1"><label className="text-xs text-zinc-400">Description</label><Textarea value={website?.seo_description || ''} onChange={(e) => updateWebsite.mutate({ seo_description: e.target.value })} className="bg-white/5 border-white/10 text-white text-sm resize-none" rows={3} maxLength={160} /></div>
              </div>
              <Separator className="bg-white/10" />
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Social Links</h3>
                {[['facebook', Facebook, 'facebook.com/...'], ['instagram', Instagram, 'instagram.com/...'], ['twitter', Twitter, 'twitter.com/...']].map(([key, Icon, ph]) => (
                  <div key={key as string} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-zinc-500" />
                    <Input value={website?.social_links?.[key as keyof typeof website.social_links] || ''} onChange={(e) => updateWebsite.mutate({ social_links: { ...website?.social_links, [key as string]: e.target.value } })} placeholder={ph as string} className="bg-white/5 border-white/10 text-white text-sm" />
                  </div>
                ))}
              </div>
            </>)}
          </div>
        </ScrollArea>
      </div>

      {/* Add Page Dialog */}
      <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Create Page</DialogTitle><DialogDescription className="text-zinc-400">Add a new page</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-zinc-300">Title</Label><Input value={newPageForm.title} onChange={(e) => setNewPageForm({ title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div className="space-y-2"><Label className="text-zinc-300">Slug</Label><Input value={newPageForm.slug} onChange={(e) => setNewPageForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPageOpen(false)} className="border-zinc-700 text-zinc-300">Cancel</Button>
            <Button onClick={() => createPage.mutate(newPageForm)} disabled={createPage.isPending || !newPageForm.title}>{createPage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Add Block</DialogTitle><DialogDescription className="text-zinc-400">Choose block type</DialogDescription></DialogHeader>
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Block</DialogTitle><DialogDescription className="text-zinc-400">Customize content</DialogDescription></DialogHeader>
          {editingBlock && <BlockEditor block={editingBlock} onSave={(content) => updateBlock.mutate({ blockId: editingBlock.id, content })} isPending={updateBlock.isPending} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
