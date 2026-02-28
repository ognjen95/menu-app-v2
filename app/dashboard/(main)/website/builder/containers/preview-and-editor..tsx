'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { DEFAULT_BLOCK_CONTENT } from '@/lib/constants/website'
import { getWebsiteUrl } from '@/utils/urls'
import { toast } from 'sonner'
import { PreviewContent } from '../components/preview-content'
import { Sidebar } from '../components/sidebar/sidebar'

// Types
export type Website = {
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

export type WebsitePage = {
  id: string
  slug: string
  title: string
  is_published: boolean
  is_in_navigation: boolean
  sort_order: number
}

export type WebsiteBlock = {
  id: string
  page_id: string
  type: string
  content: Record<string, unknown>
  settings: { padding: string; background: string; alignment: string }
  is_visible: boolean
  sort_order: number
}

// Cache structure types
type WebsiteCache = { data: { website: Website | null } }
type PagesCache = { data: { pages: WebsitePage[] } }
type BlocksCache = { data: { blocks: WebsiteBlock[] } }

export type PreviewTarget = 'website' | 'menu'

type PreviewAndEditorContainerProps = {
  website: Website | null | undefined
  initialPages?: WebsitePage[]
  sidebarOpen: boolean
  previewMode: 'desktop' | 'tablet' | 'mobile'
  previewTarget: PreviewTarget
  activePanel: 'design' | 'pages' | 'blocks' | 'settings'
  setActivePanel: (panel: 'design' | 'pages' | 'blocks' | 'settings') => void
  setShowTemplateModal: (show: boolean) => void
}

export function PreviewAndEditorContainer({
  website,
  initialPages,
  sidebarOpen,
  previewMode,
  previewTarget,
  activePanel,
  setActivePanel,
  setShowTemplateModal,
}: PreviewAndEditorContainerProps) {
  const queryClient = useQueryClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Page/Block editing state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [isAddPageOpen, setIsAddPageOpen] = useState(false)
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' })
  const [editingBlock, setEditingBlock] = useState<WebsiteBlock | null>(null)
  const [editingPageTranslation, setEditingPageTranslation] = useState<WebsitePage | null>(null)
  const [deletePageConfirm, setDeletePageConfirm] = useState<{ page: WebsitePage; blocksCount: number } | null>(null)
  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState<WebsiteBlock | null>(null)
  const [isSubdomainUpdating, setIsSubdomainUpdating] = useState(false)

  // Queries - use initialPages from SSR as initialData
  const { data: pagesData, isFetched: isPagesFetched } = useQuery({
    queryKey: ['website-pages'],
    queryFn: () => apiGet<{ data: { pages: WebsitePage[] } }>('/website/pages'),
    initialData: initialPages ? { data: { pages: initialPages } } : undefined,
  })
  const { data: blocksData, isFetched: isBlocksFetched } = useQuery({
    queryKey: ['website-blocks', selectedPageId],
    queryFn: () => apiGet<{ data: { blocks: WebsiteBlock[] } }>(`/website/pages/${selectedPageId}/blocks`),
    enabled: !!selectedPageId,
  })

  const pages = useMemo(() => pagesData?.data?.pages || [], [pagesData?.data?.pages])
  const blocks = blocksData?.data?.blocks || []

  // Helper to fetch blocks count for a page (used in delete confirmation)
  const fetchBlocksCount = useCallback(async (pageId: string) => {
    const response = await apiGet<{ data: { blocks: WebsiteBlock[] } }>(`/website/pages/${pageId}/blocks`)
    return response?.data?.blocks?.length || 0
  }, [])

  // Get the current preview URL based on target (website or menu)
  const getPreviewUrl = useCallback(() => {
    if (!website?.subdomain) return null
    
    if (previewTarget === 'menu') {
      // Menu preview: /m/{subdomain}?preview=true
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/m/${website.subdomain}`
        : `/m/${website.subdomain}`
      return `${baseUrl}?preview=true`
    }
    
    // Website preview: /site/{subdomain}?preview=true&page={slug}
    const baseUrl = getWebsiteUrl(website)
    if (!baseUrl) return null
    const selectedPage = pages.find(p => p.id === selectedPageId)
    const pageParam = selectedPage?.slug && selectedPage.slug !== 'home' ? `&page=${selectedPage.slug}` : ''
    return `${baseUrl}?preview=true${pageParam}`
  }, [website, pages, selectedPageId, previewTarget])

  // Debounced preview refresh
  const refreshPreview = useCallback((immediate = false) => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)
    const doRefresh = () => {
      if (iframeRef.current) {
        const url = getPreviewUrl()
        if (url) iframeRef.current.src = url
      }
    }
    if (immediate) {
      doRefresh()
    } else {
      refreshTimeoutRef.current = setTimeout(doRefresh, 500)
    }
  }, [getPreviewUrl])

  // Mutations
  const updateWebsite = useMutation({
    mutationFn: (data: Partial<Website>) => apiPatch('/website', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website'] })
      const prev = queryClient.getQueryData<WebsiteCache>(['website'])
      queryClient.setQueryData<WebsiteCache>(['website'], (old) =>
        old?.data?.website ? { data: { website: { ...old.data.website, ...data } } } : old
      )
      return { prev }
    },
    onError: (error: Error, _data, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website'], ctx.prev)
      toast.error(error.message || 'Failed to update website settings')
    },
    onSuccess: () => {
      toast.success('Settings saved')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] })
      refreshPreview()
    },
  })

  const createPage = useMutation({
    mutationFn: (data: { title: string; slug: string }) => apiPost('/website/pages', data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website-pages'] })
      const prev = queryClient.getQueryData<PagesCache>(['website-pages'])
      const optimisticPage: WebsitePage = {
        id: `temp-${Date.now()}`,
        ...data,
        is_published: true,
        is_in_navigation: true,
        sort_order: (prev?.data?.pages?.length || 0) + 1,
      }
      queryClient.setQueryData<PagesCache>(['website-pages'], (old) =>
        old ? { data: { pages: [...(old.data?.pages || []), optimisticPage] } } : { data: { pages: [optimisticPage] } }
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev)
    },
    onSuccess: () => {
      setIsAddPageOpen(false)
      setNewPageForm({ title: '', slug: '' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      refreshPreview()
    },
  })

  const deletePage = useMutation({
    mutationFn: (pageId: string) => apiDelete(`/website/pages/${pageId}`),
    onMutate: async (pageId) => {
      await queryClient.cancelQueries({ queryKey: ['website-pages'] })
      const prev = queryClient.getQueryData<PagesCache>(['website-pages'])
      queryClient.setQueryData<PagesCache>(['website-pages'], (old) =>
        old?.data?.pages ? { data: { pages: old.data.pages.filter(p => p.id !== pageId) } } : old
      )
      if (selectedPageId === pageId) setSelectedPageId(null)
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      refreshPreview()
    },
  })

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
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-pages'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      refreshPreview()
    },
  })

  const createBlock = useMutation({
    mutationFn: (data: { page_id: string; type: string }) => {
      const defaultContent = DEFAULT_BLOCK_CONTENT[data.type] || {}
      return apiPost(`/website/pages/${data.page_id}/blocks`, { type: data.type, content: defaultContent })
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      const pageBlocks = prev?.data?.blocks || []
      const defaultContent = DEFAULT_BLOCK_CONTENT[data.type] || {}
      const optimisticBlock: WebsiteBlock = {
        id: `temp-${Date.now()}`,
        page_id: data.page_id,
        type: data.type,
        content: defaultContent,
        settings: { padding: 'medium', background: 'transparent', alignment: 'center' },
        is_visible: true,
        sort_order: pageBlocks.length + 1,
      }
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) => ({
        data: { blocks: [...(old?.data?.blocks || []), optimisticBlock] },
      }))
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev)
    },
    onSuccess: () => setIsAddBlockOpen(false),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] })
      refreshPreview()
    },
  })

  const updateBlock = useMutation({
    mutationFn: ({ blockId, ...data }: { blockId: string } & Partial<WebsiteBlock>) =>
      apiPatch(`/website/blocks/${blockId}`, data),
    onMutate: async ({ blockId, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) =>
        old?.data?.blocks ? { data: { blocks: old.data.blocks.map(b => b.id === blockId ? { ...b, ...data } : b) } } : old
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev)
    },
    onSuccess: () => setEditingBlock(null),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] })
      refreshPreview()
    },
  })

  const deleteBlock = useMutation({
    mutationFn: (blockId: string) => apiDelete(`/website/blocks/${blockId}`),
    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], (old) =>
        old?.data?.blocks ? { data: { blocks: old.data.blocks.filter(b => b.id !== blockId) } } : old
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] })
      refreshPreview()
    },
  })

  const moveBlock = useMutation({
    mutationFn: ({ blockId, direction }: { blockId: string; direction: 'up' | 'down' }) =>
      apiPatch(`/website/blocks/${blockId}/move`, { direction }),
    onMutate: async ({ blockId, direction }) => {
      await queryClient.cancelQueries({ queryKey: ['website-blocks', selectedPageId] })
      const prev = queryClient.getQueryData<BlocksCache>(['website-blocks', selectedPageId])
      if (!prev?.data?.blocks) return { prev }
      const blocks = [...prev.data.blocks]
      const idx = blocks.findIndex(b => b.id === blockId)
      if (idx === -1) return { prev }
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= blocks.length) return { prev }
      const tempOrder = blocks[idx].sort_order
      blocks[idx] = { ...blocks[idx], sort_order: blocks[swapIdx].sort_order }
      blocks[swapIdx] = { ...blocks[swapIdx], sort_order: tempOrder }
      queryClient.setQueryData<BlocksCache>(['website-blocks', selectedPageId], { data: { blocks } })
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website-blocks', selectedPageId], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks', selectedPageId] })
      refreshPreview()
    },
  })

  // Effects - Set initial selected page (intentionally only depends on pages.length to avoid loops)
  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) setSelectedPageId(pages[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, selectedPageId])

  // Update iframe when selected page or preview target changes
  useEffect(() => {
    if (iframeRef.current) {
      const url = getPreviewUrl()
      if (url && iframeRef.current.src !== url) {
        iframeRef.current.src = url
      }
    }
  }, [selectedPageId, getPreviewUrl])

  // Listen for page navigation messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAGE_NAVIGATION' && event.data?.slug !== undefined) {
        const slug = event.data.slug || 'home'
        const page = pages.find(p => p.slug === slug || (slug === 'home' && (p.slug === 'home' || p.slug === '')))
        if (page && page.id !== selectedPageId) {
          setSelectedPageId(page.id)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [pages, selectedPageId])

  const websiteUrl = getPreviewUrl()

  return (
    <>
      {/* Preview Area */}
      <PreviewContent
        websiteUrl={websiteUrl}
        iframeRef={iframeRef}
        isSubdomainUpdating={isSubdomainUpdating}
        isPagesFetched={isPagesFetched}
        isBlocksFetched={isBlocksFetched}
        pages={pages}
        blocks={blocks}
        selectedPageId={selectedPageId}
        previewMode={previewMode}
        sidebarOpen={sidebarOpen}
        setShowTemplateModal={setShowTemplateModal}
        setActivePanel={setActivePanel}
        setIsAddBlockOpen={setIsAddBlockOpen}
      />

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        website={website}
        pages={pages}
        blocks={blocks}
        selectedPageId={selectedPageId}
        isPagesFetched={isPagesFetched}
        isBlocksFetched={isBlocksFetched}
        // Page editing state
        isAddPageOpen={isAddPageOpen}
        setIsAddPageOpen={setIsAddPageOpen}
        newPageForm={newPageForm}
        setNewPageForm={setNewPageForm}
        editingPageTranslation={editingPageTranslation}
        setEditingPageTranslation={setEditingPageTranslation}
        deletePageConfirm={deletePageConfirm}
        setDeletePageConfirm={setDeletePageConfirm}
        // Block editing state
        isAddBlockOpen={isAddBlockOpen}
        setIsAddBlockOpen={setIsAddBlockOpen}
        editingBlock={editingBlock}
        setEditingBlock={setEditingBlock}
        deleteBlockConfirm={deleteBlockConfirm}
        setDeleteBlockConfirm={setDeleteBlockConfirm}
        // Mutations
        updateWebsite={updateWebsite}
        createPage={createPage}
        deletePage={deletePage}
        togglePagePublish={togglePagePublish}
        createBlock={createBlock}
        updateBlock={updateBlock}
        deleteBlock={deleteBlock}
        moveBlock={moveBlock}
        // Handlers
        setSelectedPageId={setSelectedPageId}
        setIsSubdomainUpdating={setIsSubdomainUpdating}
        setShowTemplateModal={setShowTemplateModal}
        fetchBlocksCount={fetchBlocksCount}
        refreshPreview={refreshPreview}
      />
    </>
  )
}
