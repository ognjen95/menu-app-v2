'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch, apiPost, apiDelete } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Globe,
  ExternalLink,
  Palette,
  Layout,
  Image as ImageIcon,
  FileText,
  Settings,
  Eye,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Type,
  MapPin,
  Clock,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Star,
  ChevronUp,
  ChevronDown,
  Save,
  Undo,
  Monitor,
  Smartphone,
  Tablet,
  Edit,
  Check,
  X,
  Upload,
  UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEME_PRESETS, FONT_OPTIONS, BLOCK_TYPES } from '@/lib/constants/website'
import { getWebsiteUrl } from '@/utils/urls'

// Types
type Website = {
  id: string
  tenant_id: string
  subdomain: string | null
  custom_domain: string | null
  is_published: boolean
  theme_id: string | null
  primary_color: string | null
  secondary_color: string | null
  background_color: string | null
  foreground_color: string | null
  accent_color: string | null
  font_heading: string | null
  font_body: string | null
  logo_url: string | null
  favicon_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_image_url: string | null
  social_links: {
    facebook?: string
    instagram?: string
    twitter?: string
    tiktok?: string
  }
  settings: Record<string, unknown>
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
  settings: {
    padding: string
    background: string
    alignment: string
  }
  is_visible: boolean
  sort_order: number
}

type MenuItem = {
  id: string
  name: string
  description: string | null
  base_price: number
  image_urls: string[] | null
  is_active: boolean
  is_featured: boolean
  category: { id: string; name: string } | null
}

export default function WebsitePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('design')
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isAddPageOpen, setIsAddPageOpen] = useState(false)
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)
  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '' })
  const [editingBlock, setEditingBlock] = useState<WebsiteBlock | null>(null)
  const [showAllThemes, setShowAllThemes] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    subdomain: '',
    custom_domain: '',
    seo_title: '',
    seo_description: '',
    seo_image_url: '',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_tiktok: '',
  })
  const [designForm, setDesignForm] = useState({
    primary_color: '',
    secondary_color: '',
    background_color: '',
    foreground_color: '',
    accent_color: '',
    logo_url: '',
    favicon_url: '',
  })

  // Fetch website data
  const { data: websiteData, isLoading: websiteLoading } = useQuery({
    queryKey: ['website'],
    queryFn: () => apiGet<{ data: { website: Website | null } }>('/website'),
  })

  // Fetch pages
  const { data: pagesData } = useQuery({
    queryKey: ['website-pages'],
    queryFn: () => apiGet<{ data: { pages: WebsitePage[] } }>('/website/pages'),
  })

  // Fetch blocks for selected page
  const { data: blocksData } = useQuery({
    queryKey: ['website-blocks', selectedPageId],
    queryFn: () => apiGet<{ data: { blocks: WebsiteBlock[] } }>(`/website/pages/${selectedPageId}/blocks`),
    enabled: !!selectedPageId,
  })

  const website = websiteData?.data?.website
  const pages = pagesData?.data?.pages || []
  const blocks = blocksData?.data?.blocks || []

  // Sync forms with website data
  useEffect(() => {
    if (website) {
      setSettingsForm({
        subdomain: website.subdomain || '',
        custom_domain: website.custom_domain || '',
        seo_title: website.seo_title || '',
        seo_description: website.seo_description || '',
        seo_image_url: website.seo_image_url || '',
        social_facebook: website.social_links?.facebook || '',
        social_instagram: website.social_links?.instagram || '',
        social_twitter: website.social_links?.twitter || '',
        social_tiktok: website.social_links?.tiktok || '',
      })
      setDesignForm({
        primary_color: website.primary_color || '#3B82F6',
        secondary_color: website.secondary_color || '#F4F4F5',
        background_color: website.background_color || '#FFFFFF',
        foreground_color: website.foreground_color || '#18181B',
        accent_color: website.accent_color || '#F97316',
        logo_url: website.logo_url || '',
        favicon_url: website.favicon_url || '',
      })
    }
  }, [website])

  // Mutations
  const updateWebsite = useMutation({
    mutationFn: (data: Partial<Website>) => apiPatch('/website', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website'] }),
  })

  const createPage = useMutation({
    mutationFn: (data: { title: string; slug: string }) => apiPost('/website/pages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      setIsAddPageOpen(false)
      setNewPageForm({ title: '', slug: '' })
    },
  })

  const deletePage = useMutation({
    mutationFn: (pageId: string) => apiDelete(`/website/pages/${pageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] })
      if (selectedPageId) setSelectedPageId(null)
    },
  })

  const createBlock = useMutation({
    mutationFn: (data: { page_id: string; type: string }) =>
      apiPost(`/website/pages/${data.page_id}/blocks`, { type: data.type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks'] })
      setIsAddBlockOpen(false)
    },
  })

  const updateBlock = useMutation({
    mutationFn: ({ blockId, ...data }: { blockId: string } & Partial<WebsiteBlock>) =>
      apiPatch(`/website/blocks/${blockId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-blocks'] })
      setEditingBlock(null)
    },
  })

  const deleteBlock = useMutation({
    mutationFn: (blockId: string) => apiDelete(`/website/blocks/${blockId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website-blocks'] }),
  })

  const moveBlock = useMutation({
    mutationFn: ({ blockId, direction }: { blockId: string; direction: 'up' | 'down' }) =>
      apiPatch(`/website/blocks/${blockId}/move`, { direction }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website-blocks'] }),
  })

  const publishWebsite = useMutation({
    mutationFn: () => apiPatch('/website', { is_published: !website?.is_published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['website'] }),
  })

  // Auto-select first page
  useState(() => {
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPageId(pages[0].id)
    }
  })

  const handleThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    updateWebsite.mutate({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      background_color: preset.background,
      foreground_color: preset.foreground,
      accent_color: preset.accent,
    })
  }

  const handleColorChange = (field: keyof Website, value: string, immediate = false) => {
    const designField = field as keyof typeof designForm
    setDesignForm(prev => ({ ...prev, [designField]: value }))
    if (immediate) {
      updateWebsite.mutate({ [field]: value })
    }
  }

  const handleColorBlur = (field: keyof Website) => {
    const designField = field as keyof typeof designForm
    if (designForm[designField] !== website?.[field]) {
      updateWebsite.mutate({ [field]: designForm[designField] })
    }
  }

  const handleFontChange = (field: 'font_heading' | 'font_body', value: string) => {
    updateWebsite.mutate({ [field]: value })
  }

  if (websiteLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const websiteUrl = getWebsiteUrl(website)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Website Builder</h1>
          <p className="text-muted-foreground">
            Design and customize your restaurant&apos;s website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
            <a href="/dashboard/website/builder">
              <Layout className="h-4 w-4 mr-2" />
              Visual Builder
            </a>
          </Button>
          {websiteUrl && (
            <Button variant="outline" asChild>
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
          <Button
            onClick={() => publishWebsite.mutate()}
            disabled={publishWebsite.isPending}
            variant={website?.is_published ? 'outline' : 'default'}
          >
            {publishWebsite.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : website?.is_published ? (
              <X className="h-4 w-4 mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {website?.is_published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-3 w-3 rounded-full",
                website?.is_published ? "bg-green-500" : "bg-yellow-500"
              )} />
              <div>
                <p className="font-medium">
                  {website?.is_published ? 'Website is Live' : 'Website is Draft'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {websiteUrl || 'Configure your subdomain to get started'}
                </p>
              </div>
            </div>
            {websiteUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design">
            <Palette className="h-4 w-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="h-4 w-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="blocks">
            <Layout className="h-4 w-4 mr-2" />
            Blocks
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          {/* Theme Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>Quick start with a pre-designed theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dark Themes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Dark Themes</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {THEME_PRESETS.filter(p => p.isDark).slice(0, showAllThemes ? undefined : 6).map((preset) => {
                    const isSelected = website?.primary_color === preset.primary &&
                      website?.background_color === preset.background &&
                      website?.accent_color === preset.accent
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleThemePreset(preset)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group",
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent hover:border-primary/50"
                        )}
                        style={{ backgroundColor: preset.background }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex gap-1 mb-2">
                          <div className="h-5 w-5 rounded-full shadow-sm" style={{ backgroundColor: preset.primary }} />
                          <div className="h-5 w-5 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <p className="text-xs font-medium truncate" style={{ color: preset.foreground }}>{preset.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Light Themes */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Light Themes</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {THEME_PRESETS.filter(p => !p.isDark).slice(0, showAllThemes ? undefined : 6).map((preset) => {
                    const isSelected = website?.primary_color === preset.primary &&
                      website?.background_color === preset.background &&
                      website?.accent_color === preset.accent
                    return (
                      <button
                        key={preset.name}
                        onClick={() => handleThemePreset(preset)}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden group",
                          isSelected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-transparent hover:border-primary/50"
                        )}
                        style={{ backgroundColor: preset.background }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex gap-1 mb-2">
                          <div className="h-5 w-5 rounded-full shadow-sm border" style={{ backgroundColor: preset.primary }} />
                          <div className="h-5 w-5 rounded-full shadow-sm border" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <p className="text-xs font-medium truncate" style={{ color: preset.foreground }}>{preset.name}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* View More Button */}
              {THEME_PRESETS.length > 12 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllThemes(!showAllThemes)}
                  >
                    {showAllThemes ? 'Show Less' : `View All ${THEME_PRESETS.length} Themes`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Colors</CardTitle>
              <CardDescription>Fine-tune your brand colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { field: 'primary_color', label: 'Primary' },
                  { field: 'secondary_color', label: 'Secondary' },
                  { field: 'background_color', label: 'Background' },
                  { field: 'foreground_color', label: 'Foreground' },
                  { field: 'accent_color', label: 'Accent' },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={designForm[field as keyof typeof designForm] || '#000000'}
                        onChange={(e) => handleColorChange(field as keyof Website, e.target.value, true)}
                        className="h-10 w-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={designForm[field as keyof typeof designForm] || ''}
                        onChange={(e) => handleColorChange(field as keyof Website, e.target.value)}
                        onBlur={() => handleColorBlur(field as keyof Website)}
                        placeholder="#000000"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Choose your fonts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={website?.font_heading || 'Inter'}
                    onValueChange={(value) => handleFontChange('font_heading', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-2xl font-bold" style={{ fontFamily: website?.font_heading || 'Inter' }}>
                    Preview Heading
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={website?.font_body || 'Inter'}
                    onValueChange={(value) => handleFontChange('font_body', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p style={{ fontFamily: website?.font_body || 'Inter' }}>
                    This is how your body text will look. It should be easy to read and match your brand.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo & Favicon */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Logo and favicon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Logo URL</Label>
                  <Input
                    value={designForm.logo_url}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, logo_url: e.target.value }))}
                    onBlur={() => designForm.logo_url !== website?.logo_url && updateWebsite.mutate({ logo_url: designForm.logo_url })}
                    placeholder="https://example.com/logo.png"
                  />
                  {designForm.logo_url && (
                    <div className="p-4 bg-muted rounded-lg">
                      <img src={designForm.logo_url} alt="Logo preview" className="max-h-16 object-contain" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <Label>Favicon URL</Label>
                  <Input
                    value={designForm.favicon_url}
                    onChange={(e) => setDesignForm(prev => ({ ...prev, favicon_url: e.target.value }))}
                    onBlur={() => designForm.favicon_url !== website?.favicon_url && updateWebsite.mutate({ favicon_url: designForm.favicon_url })}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Website Pages</h3>
              <p className="text-sm text-muted-foreground">Manage your website pages</p>
            </div>
            <Button onClick={() => setIsAddPageOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
          </div>

          <div className="grid gap-4">
            {pages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first page to start building your website
                  </p>
                  <Button onClick={() => setIsAddPageOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Page
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.map((page) => (
                <Card key={page.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-sm text-muted-foreground">/{page.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={page.is_published ? 'default' : 'secondary'}>
                          {page.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <Switch
                          checked={page.is_in_navigation}
                          onCheckedChange={() => { }}
                        />
                        <span className="text-sm text-muted-foreground">In Nav</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPageId(page.id)
                            setActiveTab('blocks')
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePage.mutate(page.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={selectedPageId || ''}
                onValueChange={setSelectedPageId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Preview Mode */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setIsAddBlockOpen(true)}
              disabled={!selectedPageId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>

          {!selectedPageId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layout className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a page</h3>
                <p className="text-muted-foreground text-center">
                  Choose a page from the dropdown to edit its blocks
                </p>
              </CardContent>
            </Card>
          ) : blocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layout className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No blocks yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add blocks to build your page content
                </p>
                <Button onClick={() => setIsAddBlockOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blocks.sort((a, b) => a.sort_order - b.sort_order).map((block, index) => {
                const blockType = BLOCK_TYPES.find(b => b.type === block.type)
                const Icon = blockType?.icon || Layout

                return (
                  <Card key={block.id} className={cn(!block.is_visible && 'opacity-50')}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{blockType?.label || block.type}</p>
                          <p className="text-sm text-muted-foreground">{blockType?.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'up' })}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveBlock.mutate({ blockId: block.id, direction: 'down' })}
                            disabled={index === blocks.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={block.is_visible}
                            onCheckedChange={(checked) =>
                              updateBlock.mutate({ blockId: block.id, is_visible: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBlock(block)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBlock.mutate(block.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Domain Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>Configure your website URL</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={settingsForm.subdomain}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    onBlur={() => settingsForm.subdomain !== website?.subdomain && updateWebsite.mutate({ subdomain: settingsForm.subdomain })}
                    placeholder="your-restaurant"
                    className="max-w-xs"
                  />
                  <span className="text-muted-foreground">.qrmenu.app</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Custom Domain (Pro)</Label>
                <Input
                  value={settingsForm.custom_domain}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, custom_domain: e.target.value }))}
                  onBlur={() => settingsForm.custom_domain !== website?.custom_domain && updateWebsite.mutate({ custom_domain: settingsForm.custom_domain })}
                  placeholder="www.yourrestaurant.com"
                />
                <p className="text-sm text-muted-foreground">
                  Point your domain&apos;s CNAME record to cname.qrmenu.app
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={settingsForm.seo_title}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, seo_title: e.target.value }))}
                  onBlur={() => settingsForm.seo_title !== website?.seo_title && updateWebsite.mutate({ seo_title: settingsForm.seo_title })}
                  placeholder="Your Restaurant - Best Food in Town"
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">
                  {settingsForm.seo_title.length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={settingsForm.seo_description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, seo_description: e.target.value }))}
                  onBlur={() => settingsForm.seo_description !== website?.seo_description && updateWebsite.mutate({ seo_description: settingsForm.seo_description })}
                  placeholder="Describe your restaurant in 1-2 sentences..."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {settingsForm.seo_description.length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label>Social Share Image URL</Label>
                <Input
                  value={settingsForm.seo_image_url}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, seo_image_url: e.target.value }))}
                  onBlur={() => settingsForm.seo_image_url !== website?.seo_image_url && updateWebsite.mutate({ seo_image_url: settingsForm.seo_image_url })}
                  placeholder="https://example.com/share-image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Facebook className="h-4 w-4" /> Facebook
                  </Label>
                  <Input
                    value={settingsForm.social_facebook}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, social_facebook: e.target.value }))}
                    onBlur={() => settingsForm.social_facebook !== website?.social_links?.facebook && updateWebsite.mutate({
                      social_links: { ...website?.social_links, facebook: settingsForm.social_facebook }
                    })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                  <Input
                    value={settingsForm.social_instagram}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, social_instagram: e.target.value }))}
                    onBlur={() => settingsForm.social_instagram !== website?.social_links?.instagram && updateWebsite.mutate({
                      social_links: { ...website?.social_links, instagram: settingsForm.social_instagram }
                    })}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" /> Twitter / X
                  </Label>
                  <Input
                    value={settingsForm.social_twitter}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, social_twitter: e.target.value }))}
                    onBlur={() => settingsForm.social_twitter !== website?.social_links?.twitter && updateWebsite.mutate({
                      social_links: { ...website?.social_links, twitter: settingsForm.social_twitter }
                    })}
                    placeholder="https://twitter.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    TikTok
                  </Label>
                  <Input
                    value={settingsForm.social_tiktok}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, social_tiktok: e.target.value }))}
                    onBlur={() => settingsForm.social_tiktok !== website?.social_links?.tiktok && updateWebsite.mutate({
                      social_links: { ...website?.social_links, tiktok: settingsForm.social_tiktok }
                    })}
                    placeholder="https://tiktok.com/@yourpage"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Page Dialog */}
      <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>Add a new page to your website</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Page Title</Label>
              <Input
                value={newPageForm.title}
                onChange={(e) => setNewPageForm(prev => ({
                  ...prev,
                  title: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }))}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                value={newPageForm.slug}
                onChange={(e) => setNewPageForm(prev => ({
                  ...prev,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                }))}
                placeholder="about-us"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPageOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createPage.mutate(newPageForm)}
              disabled={createPage.isPending || !newPageForm.title}
            >
              {createPage.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Block Dialog */}
      <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
            <DialogDescription>Choose a block type to add to your page</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {BLOCK_TYPES.map((blockType) => {
              const Icon = blockType.icon
              return (
                <button
                  key={blockType.type}
                  onClick={() => {
                    if (selectedPageId) {
                      createBlock.mutate({ page_id: selectedPageId, type: blockType.type })
                    }
                  }}
                  className="flex items-start gap-3 p-4 rounded-lg border hover:border-primary hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{blockType.label}</p>
                    <p className="text-sm text-muted-foreground">{blockType.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Block Dialog */}
      <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
            <DialogDescription>Customize this block&apos;s content</DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <BlockEditor
              block={editingBlock}
              onSave={(content) => {
                updateBlock.mutate({ blockId: editingBlock.id, content })
              }}
              isPending={updateBlock.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Image Upload Component
function ImageUpload({
  value,
  onChange,
  label = 'Image'
}: {
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/website/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const { url } = await response.json()
      onChange(url)
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter URL or upload image"
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        </Button>
      </div>
      {value && (
        <div className="relative w-full h-32 mt-2 rounded-lg overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Multi Image Upload for Gallery
function MultiImageUpload({
  images,
  onChange
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/website/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Upload failed')
        const { url } = await response.json()
        return url
      })

      const newUrls = await Promise.all(uploadPromises)
      onChange([...images, ...newUrls])
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label>Gallery Images</Label>
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => removeImage(idx)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Plus className="h-6 w-6" />
              <span className="text-xs">Add</span>
            </>
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}

// Menu Items Selector Component
function MenuItemsSelector({
  selectedItems,
  onChange
}: {
  selectedItems: string[]
  onChange: (items: string[]) => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => apiGet<{ data: { items: MenuItem[] } }>('/menu/items'),
  })

  const items = data?.data?.items || []

  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onChange(selectedItems.filter(id => id !== itemId))
    } else {
      onChange([...selectedItems, itemId])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No menu items found</p>
        <p className="text-sm">Add items to your menu first</p>
      </div>
    )
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Uncategorized'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const allItemIds = items.map(item => item.id)
  const allSelected = allItemIds.length > 0 && allItemIds.every(id => selectedItems.includes(id))

  const toggleAll = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(allItemIds)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Menu Items to Display</Label>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allSelected ? 'Deselect All' : 'Select All'}
        </Button>
      </div>
      <ScrollArea className="h-[300px] rounded-md border p-4">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category} className="mb-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">{category}</h4>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  {item.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_urls[0]}
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">${item.base_price.toFixed(2)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
      <p className="text-sm text-muted-foreground">
        {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  )
}

// Block Editor Component
function BlockEditor({
  block,
  onSave,
  isPending
}: {
  block: WebsiteBlock
  onSave: (content: Record<string, unknown>) => void
  isPending: boolean
}) {
  const [content, setContent] = useState(block.content)

  const renderFields = () => {
    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={(content.headline as string) || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
                placeholder="Welcome to Our Restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={(content.subheadline as string) || ''}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                placeholder="The best food in town"
              />
            </div>
            <ImageUpload
              label="Background Image"
              value={(content.image_url as string) || ''}
              onChange={(url) => setContent({ ...content, image_url: url })}
            />
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={(content.button_text as string) || ''}
                onChange={(e) => setContent({ ...content, button_text: e.target.value })}
                placeholder="View Menu"
              />
            </div>
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input
                value={(content.button_link as string) || ''}
                onChange={(e) => setContent({ ...content, button_link: e.target.value })}
                placeholder="/menu"
              />
            </div>
          </div>
        )
      case 'about':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Our Story"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={(content.text as string) || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                placeholder="Tell your story..."
                rows={5}
              />
            </div>
            <ImageUpload
              label="About Image"
              value={(content.image_url as string) || ''}
              onChange={(url) => setContent({ ...content, image_url: url })}
            />
          </div>
        )
      case 'gallery':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Gallery"
              />
            </div>
            <MultiImageUpload
              images={(content.images as string[]) || []}
              onChange={(images) => setContent({ ...content, images })}
            />
          </div>
        )
      case 'menu_preview':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Featured Menu Items"
              />
            </div>
            <MenuItemsSelector
              selectedItems={(content.item_ids as string[]) || []}
              onChange={(itemIds) => setContent({ ...content, item_ids: itemIds })}
            />
          </div>
        )
      case 'contact':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Contact Us"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={(content.address as string) || ''}
                onChange={(e) => setContent({ ...content, address: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={(content.phone as string) || ''}
                onChange={(e) => setContent({ ...content, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={(content.email as string) || ''}
                onChange={(e) => setContent({ ...content, email: e.target.value })}
                placeholder="info@restaurant.com"
              />
            </div>
          </div>
        )
      case 'hours':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Opening Hours"
              />
            </div>
            <div className="space-y-2">
              <Label>Hours Text</Label>
              <Textarea
                value={(content.hours_text as string) || ''}
                onChange={(e) => setContent({ ...content, hours_text: e.target.value })}
                placeholder="Mon-Fri: 9am - 10pm&#10;Sat-Sun: 10am - 11pm"
                rows={5}
              />
            </div>
          </div>
        )
      case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="What Our Guests Say"
              />
            </div>
            <div className="space-y-2">
              <Label>Testimonials (JSON array)</Label>
              <Textarea
                value={JSON.stringify((content.testimonials as unknown[]) || [], null, 2)}
                onChange={(e) => {
                  try {
                    const testimonials = JSON.parse(e.target.value)
                    setContent({ ...content, testimonials })
                  } catch {
                    // Invalid JSON, don't update
                  }
                }}
                placeholder='[{"name": "John", "text": "Great food!", "rating": 5}]'
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Each testimonial: {`{ "name": "...", "text": "...", "rating": 1-5 }`}
              </p>
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                placeholder="Section Title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={(content.text as string) || ''}
                onChange={(e) => setContent({ ...content, text: e.target.value })}
                placeholder="Section content..."
                rows={4}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {renderFields()}
      <DialogFooter>
        <Button onClick={() => onSave(content)} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  )
}
