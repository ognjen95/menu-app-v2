'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useMenus, useCategories, useMenuItems, useUpdateMenu, useCreateCategory, useUpdateCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useAllergens, useReorderCategories, useReorderMenuItems, menuKeys } from '@/lib/hooks/use-menu'
import { useLocations } from '@/lib/hooks/use-tenant'
import { useQueryClient } from '@tanstack/react-query'
import type { MenuItem, Menu } from '@/lib/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { motion } from '@/components/ui/animated'
import { staggerContainer, staggerItem, staggerItemScale } from '@/components/ui/animated'
import { MenuItemsGridSkeleton, CategoriesSidebarSkeleton } from '@/components/ui/skeletons'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  GripVertical,
  ChevronRight,
  ChevronDown,
  UtensilsCrossed,
  ImageIcon,
  Loader2,
  Upload,
  X,
  Clock,
  Leaf,
  AlertTriangle,
  Tag,
  Languages,
  BookOpen,
  FileText,
  Settings2,
  Vegan,
  WheatOff,
  MilkOff,
  type LucideIcon,
} from 'lucide-react'
import { useTenantLanguages, useSaveTranslations, generateItemTranslationKey, generateCategoryTranslationKey, useTranslationsByPrefix } from '@/lib/hooks/use-translations'
import { TranslationEditor } from '@/components/features/translations/translation-editor'
import { VariantManager } from '@/components/features/menu/VariantManager'
import type { Category } from '@/lib/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Dietary tag icons mapping
const dietaryTagIcons: Record<string, LucideIcon> = {
  'vegetarian': Leaf,
  'vegan': Vegan,
  'gluten-free': WheatOff,
  'halal': Star,
  'kosher': Star,
  'dairy-free': MilkOff,
  'nut-free': AlertTriangle,
}

// Lazy load delete confirmation dialog
const ConfirmDeleteDialog = dynamic(
  () => import('@/components/ui/confirm-delete-dialog').then(mod => ({ default: mod.ConfirmDeleteDialog })),
  { ssr: false }
)

export default function MenuConfigPage() {
  const params = useParams()
  const router = useRouter()
  const menuId = params.menuId as string
  const t = useTranslations('menuPage')
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // Dialog states
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)
  
  // Form states
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    location_id: '' as string | null,
    is_active: true,
    available_from: '',
    available_until: '',
    available_days: [0, 1, 2, 3, 4, 5, 6] as number[],
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    base_price: '',
    compare_price: '',
    category_id: '',
    image_url: '',
    preparation_time: '',
    calories: '',
    is_featured: false,
    is_new: false,
    is_active: true,
    dietary_tags: [] as string[],
    allergen_ids: [] as string[],
  })
  const [isUploading, setIsUploading] = useState(false)
  
  // Translation state
  const [itemTranslations, setItemTranslations] = useState<Record<string, { name: string; description: string }>>({})
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, { name: string; description: string }>>({})

  // Dietary tag options
  const dietaryTagOptions = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free']

  const { data: menusData, isLoading: menusLoading } = useMenus()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(menuId)
  const { data: itemsData, isLoading: itemsLoading } = useMenuItems(selectedCategoryId || '')
  const { data: allergensData } = useAllergens()
  const { data: locationsData } = useLocations()
  
  // Translation hooks
  const { data: languagesData } = useTenantLanguages()
  const saveTranslations = useSaveTranslations()
  const tenantLanguages = languagesData?.data?.languages || []
  
  // Fetch existing translations when editing an item
  const { data: existingTranslationsData } = useTranslationsByPrefix(
    editingItem ? `menu_item.${editingItem.id}` : ''
  )
  
  // Fetch existing translations when editing a category
  const { data: existingCategoryTranslationsData } = useTranslationsByPrefix(
    editingCategory ? `category.${editingCategory.id}` : ''
  )
  
  const locations = useMemo(() => locationsData?.locations || [], [locationsData?.locations])
  
  const updateMenu = useUpdateMenu()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()
  const reorderCategories = useReorderCategories()
  const reorderItems = useReorderMenuItems()
  const queryClient = useQueryClient()

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const menus = useMemo(() => menusData?.data?.menus || [], [menusData?.data?.menus])
  const currentMenu = useMemo(() => menus.find(m => m.id === menuId), [menus, menuId])
  const allergens = useMemo(() => allergensData?.data?.allergens || [], [allergensData?.data?.allergens])
  const categories = useMemo(() => categoriesData?.data?.categories || [], [categoriesData?.data?.categories])
  const items = useMemo(() => itemsData?.data?.items || [], [itemsData?.data?.items])

  // Auto-select first category when loaded
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0 && !categoriesLoading) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, categoriesLoading, selectedCategoryId])

  // Populate menu form when menu loads
  useEffect(() => {
    if (currentMenu) {
      setMenuForm({
        name: currentMenu.name,
        description: currentMenu.description || '',
        location_id: currentMenu.location_id,
        is_active: currentMenu.is_active,
        available_from: currentMenu.available_from || '',
        available_until: currentMenu.available_until || '',
        available_days: currentMenu.available_days || [0, 1, 2, 3, 4, 5, 6],
      })
    }
  }, [currentMenu])

  // Populate translations when editing
  useEffect(() => {
    if (editingItem && existingTranslationsData?.data?.translations) {
      const translations: Record<string, { name: string; description: string }> = {}
      existingTranslationsData.data.translations.forEach((t: any) => {
        if (!translations[t.language_code]) {
          translations[t.language_code] = { name: '', description: '' }
        }
        if (t.key.endsWith('.name')) translations[t.language_code].name = t.value
        else if (t.key.endsWith('.description')) translations[t.language_code].description = t.value
      })
      setItemTranslations(translations)
    }
  }, [editingItem, existingTranslationsData])

  useEffect(() => {
    if (editingCategory && existingCategoryTranslationsData?.data?.translations) {
      const translations: Record<string, { name: string; description: string }> = {}
      existingCategoryTranslationsData.data.translations.forEach((t: any) => {
        if (!translations[t.language_code]) {
          translations[t.language_code] = { name: '', description: '' }
        }
        if (t.key.endsWith('.name')) translations[t.language_code].name = t.value
        else if (t.key.endsWith('.description')) translations[t.language_code].description = t.value
      })
      setCategoryTranslations(translations)
    }
  }, [editingCategory, existingCategoryTranslationsData])

  // Redirect if menu not found
  useEffect(() => {
    if (!menusLoading && menus.length > 0 && !currentMenu) {
      router.push('/dashboard/menu')
    }
  }, [menusLoading, menus, currentMenu, router])

  const handleSubmitMenu = (e: React.FormEvent) => {
    e.preventDefault()
    updateMenu.mutate({
      id: menuId,
      name: menuForm.name,
      description: menuForm.description || undefined,
      location_id: menuForm.location_id || undefined,
      is_active: menuForm.is_active,
      available_from: menuForm.available_from || undefined,
      available_until: menuForm.available_until || undefined,
      available_days: menuForm.available_days,
    }, {
      onSuccess: () => setIsMenuDialogOpen(false)
    })
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' })
    setCategoryTranslations({})
    setEditingCategory(null)
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, description: category.description || '' })
    setIsCategoryDialogOpen(true)
  }

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault()
    
    const saveCategoryTranslations = async (categoryId: string) => {
      const translationsToSave: { key: string; language_code: string; value: string }[] = []
      Object.entries(categoryTranslations).forEach(([langCode, values]) => {
        if (values.name) translationsToSave.push({ key: generateCategoryTranslationKey(categoryId, 'name'), language_code: langCode, value: values.name })
        if (values.description) translationsToSave.push({ key: generateCategoryTranslationKey(categoryId, 'description'), language_code: langCode, value: values.description })
      })
      if (translationsToSave.length > 0) await saveTranslations.mutateAsync(translationsToSave)
    }

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, menuId, name: categoryForm.name, description: categoryForm.description }, {
        onSuccess: async () => {
          await saveCategoryTranslations(editingCategory.id)
          setIsCategoryDialogOpen(false)
          resetCategoryForm()
        }
      })
    } else {
      createCategory.mutate({ menuId, name: categoryForm.name, description: categoryForm.description }, {
        onSuccess: async (data) => {
          if (data?.category?.id) await saveCategoryTranslations(data.category.id)
          setIsCategoryDialogOpen(false)
          resetCategoryForm()
        }
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'menu-items')
      const response = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
      const result = await response.json()
      if (result.data?.url) setItemForm(prev => ({ ...prev, image_url: result.data.url }))
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const resetItemForm = () => {
    setItemForm({
      name: '', description: '', base_price: '', compare_price: '', category_id: '',
      image_url: '', preparation_time: '', calories: '', is_featured: false,
      is_new: false, is_active: true, dietary_tags: [], allergen_ids: [],
    })
    setItemTranslations({})
    setEditingItem(null)
  }

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      base_price: item.base_price.toString(),
      compare_price: item.compare_price?.toString() || '',
      category_id: item.category_id,
      image_url: item.image_urls?.[0] || '',
      preparation_time: item.preparation_time?.toString() || '',
      calories: item.calories?.toString() || '',
      is_featured: item.is_featured,
      is_new: item.is_new,
      is_active: item.is_active,
      dietary_tags: item.dietary_tags || [],
      allergen_ids: item.item_allergens?.map(ia => ia.allergen_id) || [],
    })
    setIsItemDialogOpen(true)
  }

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault()
    const categoryId = itemForm.category_id || selectedCategoryId
    if (!categoryId) return

    const itemData = {
      name: itemForm.name,
      description: itemForm.description,
      base_price: parseFloat(itemForm.base_price) || 0,
      compare_price: itemForm.compare_price ? parseFloat(itemForm.compare_price) : undefined,
      image_urls: itemForm.image_url ? [itemForm.image_url] : [],
      preparation_time: itemForm.preparation_time ? parseInt(itemForm.preparation_time) : undefined,
      calories: itemForm.calories ? parseInt(itemForm.calories) : undefined,
      is_featured: itemForm.is_featured,
      is_new: itemForm.is_new,
      is_active: itemForm.is_active,
      dietary_tags: itemForm.dietary_tags,
      allergen_ids: itemForm.allergen_ids,
    }

    const saveItemTranslations = async (itemId: string) => {
      const translationsToSave: { key: string; language_code: string; value: string }[] = []
      Object.entries(itemTranslations).forEach(([langCode, values]) => {
        if (values.name) translationsToSave.push({ key: generateItemTranslationKey(itemId, 'name'), language_code: langCode, value: values.name })
        if (values.description) translationsToSave.push({ key: generateItemTranslationKey(itemId, 'description'), language_code: langCode, value: values.description })
      })
      if (translationsToSave.length > 0) await saveTranslations.mutateAsync(translationsToSave)
    }

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, categoryId, ...itemData }, {
        onSuccess: async () => {
          await saveItemTranslations(editingItem.id)
          setIsItemDialogOpen(false)
          resetItemForm()
        }
      })
    } else {
      createItem.mutate({ categoryId, ...itemData }, {
        onSuccess: async (data) => {
          if (data?.item?.id) await saveItemTranslations(data.item.id)
          setIsItemDialogOpen(false)
          resetItemForm()
        }
      })
    }
  }

  const handleCategoryDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex(c => c.id === active.id)
    const newIndex = categories.findIndex(c => c.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(categories, oldIndex, newIndex)
      queryClient.setQueryData(menuKeys.categories(menuId), (old: any) => {
        if (!old?.data?.categories) return old
        return { ...old, data: { ...old.data, categories: newOrder } }
      })
      reorderCategories.mutate({ menuId, categoryIds: newOrder.map(c => c.id) })
    }
  }, [categories, menuId, reorderCategories, queryClient])

  const handleItemDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedCategoryId) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(items, oldIndex, newIndex)
      queryClient.setQueryData(menuKeys.items(selectedCategoryId), (old: any) => {
        if (!old?.data?.items) return old
        return { ...old, data: { ...old.data, items: newOrder } }
      })
      reorderItems.mutate({ categoryId: selectedCategoryId, itemIds: newOrder.map(i => i.id) })
    }
  }, [items, selectedCategoryId, reorderItems, queryClient])

  // Sortable Category Item
  const SortableCategoryItem = ({ category }: { category: Category }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      zIndex: isDragging ? 50 : undefined,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer group touch-none',
          selectedCategoryId === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
          isDragging && 'opacity-80 shadow-lg'
        )}
        onClick={() => setSelectedCategoryId(category.id)}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 opacity-50 hover:opacity-100" />
        </div>
        <span className="flex-1 truncate">{category.name}</span>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0",
            selectedCategoryId === category.id && "text-primary-foreground hover:bg-primary-foreground/20"
          )}
          onClick={(e) => { e.stopPropagation(); openEditCategoryDialog(category) }}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  // Sortable Menu Item
  const SortableMenuItem = ({ item }: { item: MenuItem }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
    const style: React.CSSProperties = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition: isDragging ? undefined : transition,
      zIndex: isDragging ? 50 : undefined,
      willChange: isDragging ? 'transform' : undefined,
    }

    return (
      <Card ref={setNodeRef} style={style} className={cn("overflow-hidden group touch-none select-none", isDragging && "opacity-90 shadow-2xl ring-2 ring-primary scale-[1.02]")}>
        <div className="relative h-36 bg-muted">
          {item.image_urls && item.image_urls.length > 0 ? (
            <Image src={item.image_urls[0]} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full"><ImageIcon className="h-10 w-10 text-muted-foreground" /></div>
          )}
          <div {...attributes} {...listeners} className="absolute top-2 left-2 p-1.5 rounded-md bg-background/90 backdrop-blur-sm cursor-grab active:cursor-grabbing shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="absolute top-2 left-12 flex gap-1">
            {item.is_featured && <Badge className="bg-yellow-500 hover:bg-yellow-600"><Star className="h-3 w-3 mr-1 fill-current" />Featured</Badge>}
            {item.is_new && <Badge className="bg-blue-500 hover:bg-blue-600">{t('new')}</Badge>}
            {!item.is_active && <Badge variant="secondary">{t('hidden')}</Badge>}
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => selectedCategoryId && updateItem.mutate({ id: item.id, categoryId: selectedCategoryId, is_active: !item.is_active })}>
              {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold line-clamp-1">{item.name}</h3>
            <div className="text-right shrink-0">
              <div className="font-bold text-lg">€{item.base_price.toFixed(2)}</div>
              {item.compare_price && <div className="text-sm text-muted-foreground line-through">€{item.compare_price.toFixed(2)}</div>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description || t('noDescription')}</p>
          <div className="flex flex-wrap gap-1">
            {item.dietary_tags?.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            {item.item_allergens && item.item_allergens.length > 0 && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300"><AlertTriangle className="h-3 w-3 mr-1" />{item.item_allergens.length} {t('allergens')}</Badge>
            )}
            {item.preparation_time && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{item.preparation_time}min</Badge>}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (menusLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3"><CategoriesSidebarSkeleton count={5} /></div>
          <div className="lg:col-span-9"><MenuItemsGridSkeleton count={6} /></div>
        </div>
      </div>
    )
  }

  if (!currentMenu) return null

  return (
    <div className="space-y-4">
      {/* Page header */}
      <motion.div 
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard/menu')}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline ml-1">{t('backToMenus')}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-semibold">{currentMenu.name}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {menus.map((menu) => (
                  <DropdownMenuItem 
                    key={menu.id} 
                    onClick={() => router.push(`/dashboard/menu/${menu.id}`)} 
                    className={cn(menuId === menu.id && "bg-accent")}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />{menu.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">{t('manageMenuDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsMenuDialogOpen(true)}>
            <Edit className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('editMenu')}</span>
          </Button>
          <Button onClick={() => setIsItemDialogOpen(true)} size="sm" disabled={!selectedCategoryId}>
            <Plus className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">{t('addItem')}</span>
          </Button>
        </div>
      </motion.div>

      {/* Main layout with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Categories Sidebar */}
        <motion.div 
          className="lg:col-span-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('categories')}</CardTitle>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {categoriesLoading ? (
                <CategoriesSidebarSkeleton count={5} />
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{t('noCategories')}</p>
                  <Button size="sm" variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />{t('addCategory')}
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                  <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <motion.div className="space-y-1" initial="initial" animate="animate" variants={staggerContainer}>
                      {categories.map((category, index) => (
                        <motion.div key={category.id} variants={staggerItem} custom={index}>
                          <SortableCategoryItem category={category} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Items Grid */}
        <motion.div 
          className="lg:col-span-9"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {!selectedCategoryId ? (
            <Card className="p-12">
              <div className="text-center">
                <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('selectCategoryToView')}</h2>
                <p className="text-muted-foreground">{t('selectCategoryDesc')}</p>
              </div>
            </Card>
          ) : itemsLoading ? (
            <MenuItemsGridSkeleton count={6} />
          ) : items.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">{t('noItemsInCategory')}</h2>
                <p className="text-muted-foreground mb-6">{t('addFirstItemDesc')}</p>
                <Button onClick={() => setIsItemDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />{t('addFirstItem')}</Button>
              </div>
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  initial="initial"
                  animate="animate"
                  variants={staggerContainer}
                  key={selectedCategoryId}
                >
                  {items.map((item, index) => (
                    <motion.div key={item.id} variants={staggerItemScale} custom={index}>
                      <SortableMenuItem item={item} />
                    </motion.div>
                  ))}
                </motion.div>
              </SortableContext>
            </DndContext>
          )}
        </motion.div>
      </div>

      {/* Edit Menu Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editMenuTitle')}</DialogTitle>
            <DialogDescription>{t('editMenuDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitMenu} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">{t('menuName')} *</Label>
              <Input id="menu-name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} placeholder={t('menuNamePlaceholder')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-description">{t('menuDescription')}</Label>
              <Input id="menu-description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} placeholder={t('menuDescPlaceholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('location')}</Label>
              <Select value={menuForm.location_id || 'all'} onValueChange={(value) => setMenuForm({ ...menuForm, location_id: value === 'all' ? null : value })}>
                <SelectTrigger><SelectValue placeholder={t('allLocations')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allLocations')}</SelectItem>
                  {locations.map((loc) => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('menuLocationHint')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available-from">{t('availableFrom')}</Label>
                <Input id="available-from" type="time" value={menuForm.available_from} onChange={(e) => setMenuForm({ ...menuForm, available_from: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available-until">{t('availableUntil')}</Label>
                <Input id="available-until" type="time" value={menuForm.available_until} onChange={(e) => setMenuForm({ ...menuForm, available_until: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('availableDays')}</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 0, label: t('sunday') }, { day: 1, label: t('monday') }, { day: 2, label: t('tuesday') },
                  { day: 3, label: t('wednesday') }, { day: 4, label: t('thursday') }, { day: 5, label: t('friday') }, { day: 6, label: t('saturday') },
                ].map(({ day, label }) => (
                  <label key={day} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={menuForm.available_days.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) setMenuForm({ ...menuForm, available_days: [...menuForm.available_days, day].sort() })
                        else setMenuForm({ ...menuForm, available_days: menuForm.available_days.filter(d => d !== day) })
                      }}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="menu-active">{t('menuActive')}</Label>
                <p className="text-xs text-muted-foreground">{t('menuActiveHint')}</p>
              </div>
              <Switch id="menu-active" checked={menuForm.is_active} onCheckedChange={(checked) => setMenuForm({ ...menuForm, is_active: checked })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMenuDialogOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={updateMenu.isPending}>
                {updateMenu.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('updateMenu')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => { setIsCategoryDialogOpen(open); if (!open) resetCategoryForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editCategoryTitle') : t('createCategoryTitle')}</DialogTitle>
            <DialogDescription>{editingCategory ? t('editCategoryDesc') : t('createCategoryDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('basicInfo')}</span>
                </TabsTrigger>
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">{t('categoryName')} *</Label>
                    <Input id="category-name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder={t('categoryNamePlaceholder')} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">{t('categoryDescription')}</Label>
                    <Textarea id="category-description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder={t('categoryDescPlaceholder')} rows={3} />
                  </div>
                </TabsContent>
                <TabsContent value="translations" className="mt-4">
                  <TranslationEditor
                    languages={tenantLanguages}
                    translations={categoryTranslations}
                    onTranslationsChange={(vals) => setCategoryTranslations(vals as Record<string, { name: string; description: string }>)}
                    fields={[
                      { key: 'name', label: t('categoryName'), type: 'input', placeholder: t('categoryNamePlaceholder') },
                      { key: 'description', label: t('categoryDescription'), type: 'textarea', placeholder: t('categoryDescPlaceholder'), rows: 3 },
                    ]}
                    defaultValues={{ name: categoryForm.name, description: categoryForm.description }}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsCategoryDialogOpen(false); resetCategoryForm() }}>{t('cancel')}</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCategory ? t('updateCategory') : t('createCategory')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={(open) => { setIsItemDialogOpen(open); if (!open) resetItemForm() }}>
        <DialogContent className="max-w-5xl h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editMenuItem') : t('createMenuItem')}</DialogTitle>
            <DialogDescription>{editingItem ? t('editMenuItemDesc') : t('createMenuItemDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitItem} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className={cn("grid w-full", editingItem ? "grid-cols-5" : "grid-cols-4")}>
                <TabsTrigger value="basic" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('basicInfo')}</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-1">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('details')}</span>
                </TabsTrigger>
                <TabsTrigger value="dietary" className="gap-1">
                  <Leaf className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('dietaryAllergens')}</span>
                </TabsTrigger>
                {editingItem && (
                  <TabsTrigger value="variants" className="gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('variants')}</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {!editingItem && !selectedCategoryId && (
                    <div className="space-y-2">
                      <Label>{t('category')} *</Label>
                      <Select value={itemForm.category_id} onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
                        <SelectContent>{categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="item-name">{t('itemName')} *</Label>
                        <Input id="item-name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder={t('itemNamePlaceholder')} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item-description">{t('itemDescription')}</Label>
                        <Textarea id="item-description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder={t('itemDescPlaceholder')} rows={4} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('image')}</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          {itemForm.image_url ? (
                            <div className="relative aspect-video rounded-lg overflow-hidden">
                              <Image src={itemForm.image_url} alt="Preview" fill className="object-cover" />
                              <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8" onClick={() => setItemForm({ ...itemForm, image_url: '' })}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-4">
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                              {isUploading ? <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />}
                              <p className="text-sm text-muted-foreground">{isUploading ? t('uploading') : t('clickToUpload')}</p>
                              <p className="text-xs text-muted-foreground mt-1">{t('imageFormats')}</p>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="base-price">{t('price')} *</Label>
                      <Input id="base-price" type="number" step="0.01" min="0" value={itemForm.base_price} onChange={(e) => setItemForm({ ...itemForm, base_price: e.target.value })} placeholder={t('pricePlaceholder')} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compare-price">{t('comparePrice')}</Label>
                      <Input id="compare-price" type="number" step="0.01" min="0" value={itemForm.compare_price} onChange={(e) => setItemForm({ ...itemForm, compare_price: e.target.value })} placeholder={t('comparePricePlaceholder')} />
                      <p className="text-xs text-muted-foreground">{t('comparePriceHint')}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prep-time">{t('prepTime')}</Label>
                      <Input id="prep-time" type="number" min="0" value={itemForm.preparation_time} onChange={(e) => setItemForm({ ...itemForm, preparation_time: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calories">{t('caloriesKcal')}</Label>
                      <Input id="calories" type="number" min="0" value={itemForm.calories} onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4">
                    <h3 className="font-medium">{t('itemStatus')}</h3>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><Label htmlFor="is-active">{t('active')}</Label><p className="text-xs text-muted-foreground">{t('activeHint')}</p></div>
                      <Switch id="is-active" checked={itemForm.is_active} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_active: checked })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><Label htmlFor="is-featured">{t('featured')}</Label><p className="text-xs text-muted-foreground">{t('featuredHint')}</p></div>
                      <Switch id="is-featured" checked={itemForm.is_featured} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_featured: checked })} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div><Label htmlFor="is-new">{t('newItemLabel')}</Label><p className="text-xs text-muted-foreground">{t('newItemHint')}</p></div>
                      <Switch id="is-new" checked={itemForm.is_new} onCheckedChange={(checked) => setItemForm({ ...itemForm, is_new: checked })} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dietary" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t('dietaryTags')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {dietaryTagOptions.map((tag) => (
                        <label key={tag} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors", itemForm.dietary_tags.includes(tag) ? "border-primary bg-primary/5" : "hover:bg-accent")}>
                          <Checkbox checked={itemForm.dietary_tags.includes(tag)} onCheckedChange={(checked) => {
                            if (checked) setItemForm({ ...itemForm, dietary_tags: [...itemForm.dietary_tags, tag] })
                            else setItemForm({ ...itemForm, dietary_tags: itemForm.dietary_tags.filter(t => t !== tag) })
                          }} />
                          <span className="text-sm capitalize">{tag.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('allergensTitle')}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{t('allergensHint')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allergens.map((allergen) => (
                        <label key={allergen.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors", itemForm.allergen_ids.includes(allergen.id) ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "hover:bg-accent")}>
                          <Checkbox checked={itemForm.allergen_ids.includes(allergen.id)} onCheckedChange={(checked) => {
                            if (checked) setItemForm({ ...itemForm, allergen_ids: [...itemForm.allergen_ids, allergen.id] })
                            else setItemForm({ ...itemForm, allergen_ids: itemForm.allergen_ids.filter(id => id !== allergen.id) })
                          }} />
                          <span className="text-sm">{allergen.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {editingItem && (
                  <TabsContent value="variants" className="mt-4">
                    <VariantManager menuItemId={editingItem.id} menuItemName={editingItem.name} basePrice={editingItem.base_price} />
                  </TabsContent>
                )}

                <TabsContent value="translations" className="mt-4">
                  <TranslationEditor
                    languages={tenantLanguages}
                    translations={itemTranslations}
                    onTranslationsChange={(vals) => setItemTranslations(vals as Record<string, { name: string; description: string }>)}
                    fields={[
                      { key: 'name', label: t('itemName'), type: 'input', placeholder: t('itemNamePlaceholder') },
                      { key: 'description', label: t('itemDescription'), type: 'textarea', placeholder: t('itemDescPlaceholder'), rows: 3 },
                    ]}
                    defaultValues={{ name: itemForm.name, description: itemForm.description }}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsItemDialogOpen(false); resetItemForm() }}>{t('cancel')}</Button>
              <Button type="submit" disabled={(createItem.isPending || updateItem.isPending) || (!editingItem && !selectedCategoryId && !itemForm.category_id)}>
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? t('updateItem') : t('createItem')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={t('deleteItem')}
        description={t('deleteItemConfirm', { name: itemToDelete?.name || '' })}
        onConfirm={() => {
          if (itemToDelete && selectedCategoryId) {
            deleteItem.mutate(
              { id: itemToDelete.id, categoryId: selectedCategoryId },
              { onSuccess: () => setItemToDelete(null) }
            )
          }
        }}
        isLoading={deleteItem.isPending}
      />
    </div>
  )
}
