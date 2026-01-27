'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useMenus, useCategories, useMenuItems, useCreateMenu, useCreateCategory, useUpdateCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useAllergens } from '@/lib/hooks/use-menu'
import type { MenuItem } from '@/lib/types'
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
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  GripVertical,
  Search,
  Filter,
  ChevronRight,
  UtensilsCrossed,
  ImageIcon,
  Loader2,
  Upload,
  X,
  Clock,
  Flame,
  Leaf,
  AlertTriangle,
  Sparkles,
  Tag,
  Languages,
} from 'lucide-react'
import { useTenantLanguages, useSaveTranslations, generateItemTranslationKey, generateCategoryTranslationKey, useTranslationsByPrefix } from '@/lib/hooks/use-translations'
import { TranslationEditor } from '@/components/features/translations/translation-editor'
import type { Category } from '@/lib/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  const t = useTranslations('menuPage')
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form states
  const [menuForm, setMenuForm] = useState({ name: '', description: '' })
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
  
  // Translation state - stores { [language_code]: { name: string, description: string } }
  const [itemTranslations, setItemTranslations] = useState<Record<string, { name: string; description: string }>>({})
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, { name: string; description: string }>>({})

  // Dietary tag options
  const dietaryTagOptions = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free']

  const { data: menusData, isLoading: menusLoading } = useMenus()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(selectedMenuId || '')
  const { data: itemsData, isLoading: itemsLoading } = useMenuItems(selectedCategoryId || '')
  const { data: allergensData } = useAllergens()
  
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
  
  // Get default language
  const defaultLanguage = tenantLanguages.find(tl => tl.is_default)?.language_code
  
  const createMenu = useCreateMenu()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const menus = useMemo(() => menusData?.data?.menus || [], [menusData?.data?.menus])
  const allergens = useMemo(() => allergensData?.data?.allergens || [], [allergensData?.data?.allergens])
  const categories = useMemo(() => categoriesData?.data?.categories || [], [categoriesData?.data?.categories])
  const items = useMemo(() => itemsData?.data?.items || [], [itemsData?.data?.items])

  // Auto-select first menu if none selected
  useEffect(() => {
    if (!selectedMenuId && menus.length > 0 && !menusLoading) {
      setSelectedMenuId(menus[0].id)
    }
  }, [menus, menusLoading, selectedMenuId])

  // Auto-select first category if none selected
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0 && !categoriesLoading && selectedMenuId) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, categoriesLoading, selectedMenuId, selectedCategoryId])
  
  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault()
    createMenu.mutate({ name: menuForm.name, description: menuForm.description }, {
      onSuccess: () => {
        setIsCreateMenuOpen(false)
        setMenuForm({ name: '', description: '' })
      }
    })
  }
  
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' })
    setCategoryTranslations({})
    setEditingCategory(null)
  }

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    })
    setIsCategoryDialogOpen(true)
  }

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMenuId) return

    // Helper to save translations for a category
    const saveCategoryTranslations = async (categoryId: string) => {
      const translationsToSave: { key: string; language_code: string; value: string }[] = []
      
      Object.entries(categoryTranslations).forEach(([langCode, values]) => {
        if (values.name) {
          translationsToSave.push({
            key: generateCategoryTranslationKey(categoryId, 'name'),
            language_code: langCode,
            value: values.name,
          })
        }
        if (values.description) {
          translationsToSave.push({
            key: generateCategoryTranslationKey(categoryId, 'description'),
            language_code: langCode,
            value: values.description,
          })
        }
      })
      
      if (translationsToSave.length > 0) {
        await saveTranslations.mutateAsync(translationsToSave)
      }
    }

    if (editingCategory) {
      updateCategory.mutate({ 
        id: editingCategory.id, 
        menuId: selectedMenuId, 
        name: categoryForm.name, 
        description: categoryForm.description 
      }, {
        onSuccess: async () => {
          await saveCategoryTranslations(editingCategory.id)
          setIsCategoryDialogOpen(false)
          resetCategoryForm()
        }
      })
    } else {
      createCategory.mutate({ 
        menuId: selectedMenuId, 
        name: categoryForm.name, 
        description: categoryForm.description 
      }, {
        onSuccess: async (data) => {
          if (data?.category?.id) {
            await saveCategoryTranslations(data.category.id)
          }
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
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      
      const result = await response.json()
      if (result.data?.url) {
        setItemForm(prev => ({ ...prev, image_url: result.data.url }))
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const resetItemForm = () => {
    setItemForm({
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
      dietary_tags: [],
      allergen_ids: [],
    })
    setItemTranslations({})
    setEditingItem(null)
  }

  // Populate translations when editing an item and translations are loaded
  useEffect(() => {
    if (editingItem && existingTranslationsData?.data?.translations) {
      const translations: Record<string, { name: string; description: string }> = {}
      const existingTranslations = existingTranslationsData.data.translations
      
      // Group translations by language
      existingTranslations.forEach(t => {
        if (!translations[t.language_code]) {
          translations[t.language_code] = { name: '', description: '' }
        }
        if (t.key.endsWith('.name')) {
          translations[t.language_code].name = t.value
        } else if (t.key.endsWith('.description')) {
          translations[t.language_code].description = t.value
        }
      })
      
      setItemTranslations(translations)
    }
  }, [editingItem, existingTranslationsData])

  // Populate category translations when editing
  useEffect(() => {
    if (editingCategory && existingCategoryTranslationsData?.data?.translations) {
      const translations: Record<string, { name: string; description: string }> = {}
      const existingTranslations = existingCategoryTranslationsData.data.translations
      
      existingTranslations.forEach(t => {
        if (!translations[t.language_code]) {
          translations[t.language_code] = { name: '', description: '' }
        }
        if (t.key.endsWith('.name')) {
          translations[t.language_code].name = t.value
        } else if (t.key.endsWith('.description')) {
          translations[t.language_code].description = t.value
        }
      })
      
      setCategoryTranslations(translations)
    }
  }, [editingCategory, existingCategoryTranslationsData])

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

    // Helper to save translations for an item
    const saveItemTranslations = async (itemId: string) => {
      const translationsToSave: { key: string; language_code: string; value: string }[] = []
      
      Object.entries(itemTranslations).forEach(([langCode, values]) => {
        if (values.name) {
          translationsToSave.push({
            key: generateItemTranslationKey(itemId, 'name'),
            language_code: langCode,
            value: values.name,
          })
        }
        if (values.description) {
          translationsToSave.push({
            key: generateItemTranslationKey(itemId, 'description'),
            language_code: langCode,
            value: values.description,
          })
        }
      })
      
      if (translationsToSave.length > 0) {
        await saveTranslations.mutateAsync(translationsToSave)
      }
    }

    if (editingItem) {
      // Update existing item
      updateItem.mutate({ 
        id: editingItem.id,
        categoryId,
        ...itemData,
      }, {
        onSuccess: async () => {
          await saveItemTranslations(editingItem.id)
          setIsItemDialogOpen(false)
          resetItemForm()
        }
      })
    } else {
      // Create new item
      createItem.mutate({ 
        categoryId,
        ...itemData,
      }, {
        onSuccess: async (data) => {
          // Save translations for the newly created item
          if (data?.item?.id) {
            await saveItemTranslations(data.item.id)
          }
          setIsItemDialogOpen(false)
          resetItemForm()
        }
      })
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="md:size-default">
            <Filter className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('filter')}</span>
          </Button>
          <Button onClick={() => setIsItemDialogOpen(true)} size="sm" className="md:size-default">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden sm:inline">{t('addItem')}</span>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('searchItems')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Menus sidebar */}
        <div className="md:col-span-1 lg:col-span-3">
          <Card>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{t('menus')}</CardTitle>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsCreateMenuOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {menusLoading ? (
                <div className="text-sm text-muted-foreground">{t('loading')}</div>
              ) : menus.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t('noMenus')}</div>
              ) : (
                menus.map((menu) => (
                  <button
                    key={menu.id}
                    onClick={() => {
                      setSelectedMenuId(menu.id)
                      setSelectedCategoryId(null)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      selectedMenuId === menu.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {menu.name}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="md:col-span-1 lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{t('categories')}</CardTitle>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selectedMenuId} onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {!selectedMenuId ? (
                <div className="text-sm text-muted-foreground">{t('selectMenuFirst')}</div>
              ) : categoriesLoading ? (
                <div className="text-sm text-muted-foreground">{t('loading')}</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('noCategories')}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setIsCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addCategory')}
                  </Button>
                </div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors group cursor-pointer',
                      selectedCategoryId === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-grab" />
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "h-7 w-7 opacity-0 group-hover:opacity-100",
                          selectedCategoryId === category.id && "text-primary-foreground hover:bg-primary-foreground/10"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditCategoryDialog(category)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <div className="md:col-span-2 lg:col-span-6">
          <Card className="h-full min-h-[400px]">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedCategoryId 
                      ? categories.find(c => c.id === selectedCategoryId)?.name || t('items')
                      : t('items')}
                  </CardTitle>
                  <CardDescription>
                    {items.length} {items.length === 1 ? t('item') : t('items')}
                  </CardDescription>
                </div>
                <Button size="sm" disabled={!selectedCategoryId} onClick={() => setIsItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addItem')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedCategoryId ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">{t('selectCategoryToView')}</p>
                </div>
              ) : itemsLoading ? (
                <div className="text-muted-foreground py-8">{t('loadingItems')}</div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">{t('noItemsInCategory')}</p>
                  <Button onClick={() => setIsItemDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('addFirstItem')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border hover:bg-accent/50 transition-colors group"
                    >
                      <GripVertical className="hidden lg:block h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                      
                      {/* Image */}
                      <div className="relative h-20 w-20 sm:h-16 sm:w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image_urls && item.image_urls.length > 0 ? (
                          <Image
                            src={item.image_urls[0]}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-base sm:text-sm">{item.name}</h3>
                          {item.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {item.is_new && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">{t('new')}</span>
                          )}
                          {!item.is_active && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{t('hidden')}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                          {item.description || t('noDescription')}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                          {item.dietary_tags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.item_allergens && item.item_allergens.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {item.item_allergens.length} {t('allergens')}
                            </span>
                          )}
                          {item.preparation_time && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {item.preparation_time}min
                            </span>
                          )}
                          {item.calories && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {item.calories}kcal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 sm:text-right ml-auto sm:ml-0">
                        <div className="font-semibold text-lg sm:text-base">
                          €{item.base_price.toFixed(2)}
                        </div>
                        {item.compare_price && (
                          <div className="text-sm text-muted-foreground line-through">
                            €{item.compare_price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(item)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (selectedCategoryId) {
                              updateItem.mutate({ 
                                id: item.id, 
                                categoryId: selectedCategoryId,
                                is_active: !item.is_active 
                              })
                            }
                          }}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            selectedCategoryId && deleteItem.mutate({ id: item.id, categoryId: selectedCategoryId })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Menu Dialog */}
      <Dialog open={isCreateMenuOpen} onOpenChange={setIsCreateMenuOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createMenuTitle')}</DialogTitle>
            <DialogDescription>{t('createMenuDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMenu} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">{t('menuName')} *</Label>
              <Input
                id="menu-name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                placeholder={t('menuNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-description">{t('menuDescription')}</Label>
              <Input
                id="menu-description"
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                placeholder={t('menuDescPlaceholder')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateMenuOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createMenu.isPending}>
                {createMenu.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('createMenu')}
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
            <DialogDescription>
              {editingCategory ? t('editCategoryDesc') : t('createCategoryDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{t('basicInfo')}</TabsTrigger>
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">{t('categoryName')} *</Label>
                    <Input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder={t('categoryNamePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">{t('categoryDescription')}</Label>
                    <Textarea
                      id="category-description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder={t('categoryDescPlaceholder')}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                {/* Translations Tab */}
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
              <Button type="button" variant="outline" onClick={() => { setIsCategoryDialogOpen(false); resetCategoryForm() }}>
                {t('cancel')}
              </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? t('editMenuItem') : t('createMenuItem')}</DialogTitle>
            <DialogDescription>
              {editingItem ? t('editMenuItemDesc') : t('createMenuItemDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitItem} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">{t('basicInfo')}</TabsTrigger>
                <TabsTrigger value="details">{t('details')}</TabsTrigger>
                <TabsTrigger value="dietary">{t('dietaryAllergens')}</TabsTrigger>
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Category selector - only show when creating and no category selected */}
                  {!editingItem && !selectedCategoryId && (
                    <div className="space-y-2">
                      <Label>{t('category')} *</Label>
                      <Select
                        value={itemForm.category_id}
                        onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="item-name">{t('itemName')} *</Label>
                    <Input
                      id="item-name"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('itemNamePlaceholder')}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="item-description">{t('itemDescription')}</Label>
                    <Textarea
                      id="item-description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('itemDescPlaceholder')}
                      rows={3}
                    />
                  </div>

                  {/* Image */}
                  <div className="space-y-2">
                    <Label>{t('image')}</Label>
                    {itemForm.image_url ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                        <Image
                          src={itemForm.image_url}
                          alt="Item preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setItemForm(prev => ({ ...prev, image_url: '' }))}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">{t('uploading')}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">{t('clickToUpload')}</span>
                            <span className="text-xs text-muted-foreground">{t('imageFormats')}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    )}
                  </div>

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-price">{t('price')} *</Label>
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.base_price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, base_price: e.target.value }))}
                        placeholder={t('pricePlaceholder')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-compare-price">{t('comparePrice')}</Label>
                      <Input
                        id="item-compare-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.compare_price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, compare_price: e.target.value }))}
                        placeholder={t('comparePricePlaceholder')}
                      />
                      <p className="text-xs text-muted-foreground">{t('comparePriceHint')}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Preparation time & calories */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prep-time" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('prepTime')}
                      </Label>
                      <Input
                        id="prep-time"
                        type="number"
                        min="0"
                        value={itemForm.preparation_time}
                        onChange={(e) => setItemForm(prev => ({ ...prev, preparation_time: e.target.value }))}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calories" className="flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        {t('caloriesKcal')}
                      </Label>
                      <Input
                        id="calories"
                        type="number"
                        min="0"
                        value={itemForm.calories}
                        onChange={(e) => setItemForm(prev => ({ ...prev, calories: e.target.value }))}
                        placeholder="450"
                      />
                    </div>
                  </div>

                  {/* Status toggles */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      {t('itemStatus')}
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="is-active">{t('active')}</Label>
                          <p className="text-xs text-muted-foreground">{t('activeHint')}</p>
                        </div>
                        <Switch
                          id="is-active"
                          checked={itemForm.is_active}
                          onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_active: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="is-featured" className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {t('featured')}
                          </Label>
                          <p className="text-xs text-muted-foreground">{t('featuredHint')}</p>
                        </div>
                        <Switch
                          id="is-featured"
                          checked={itemForm.is_featured}
                          onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_featured: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="is-new" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            {t('newItemLabel')}
                          </Label>
                          <p className="text-xs text-muted-foreground">{t('newItemHint')}</p>
                        </div>
                        <Switch
                          id="is-new"
                          checked={itemForm.is_new}
                          onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_new: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="dietary" className="space-y-4 mt-4">
                  {/* Dietary tags */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-green-600" />
                      {t('dietaryTags')}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {dietaryTagOptions.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dietary-${tag}`}
                            checked={itemForm.dietary_tags.includes(tag)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setItemForm(prev => ({ ...prev, dietary_tags: [...prev.dietary_tags, tag] }))
                              } else {
                                setItemForm(prev => ({ ...prev, dietary_tags: prev.dietary_tags.filter(t => t !== tag) }))
                              }
                            }}
                          />
                          <label
                            htmlFor={`dietary-${tag}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      {t('allergensTitle')}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t('allergensHint')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {allergens.map((allergen) => (
                        <div key={allergen.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergen-${allergen.id}`}
                            checked={itemForm.allergen_ids.includes(allergen.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setItemForm(prev => ({ ...prev, allergen_ids: [...prev.allergen_ids, allergen.id] }))
                              } else {
                                setItemForm(prev => ({ ...prev, allergen_ids: prev.allergen_ids.filter(id => id !== allergen.id) }))
                              }
                            }}
                          />
                          <label
                            htmlFor={`allergen-${allergen.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {allergen.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Translations Tab */}
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
              <Button type="button" variant="outline" onClick={() => { setIsItemDialogOpen(false); resetItemForm() }}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={(createItem.isPending || updateItem.isPending) || (!editingItem && !selectedCategoryId && !itemForm.category_id)}
              >
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? t('updateItem') : t('createItem')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
