'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'
import type { VariantCategory, MenuItemVariant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'
import { TranslationEditor } from '@/features/translations/translation-editor'
import { Plus, Trash2, Edit, Loader2, Tag, Settings, Languages } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useTenantLanguages,
  useSaveTranslations,
  useTranslationsByPrefix,
  generateVariantCategoryTranslationKey,
  generateMenuItemVariantTranslationKey,
} from '@/lib/hooks/use-translations'

interface VariantManagerProps {
  menuItemId: string
  menuItemName: string
  basePrice: number
  currency?: string
}

export function VariantManager({ menuItemId, menuItemName, basePrice, currency = 'EUR' }: VariantManagerProps) {
  const t = useTranslations('variants')
  const queryClient = useQueryClient()

  // State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<VariantCategory | null>(null)
  const [editingVariant, setEditingVariant] = useState<MenuItemVariant | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'category' | 'variant'; item: VariantCategory | MenuItemVariant } | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', is_required: false, allow_multiple: false })
  const [variantForm, setVariantForm] = useState({ name: '', price_adjustment: '', category_id: '', is_default: false })

  // Translation states
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, { name: string; description: string }>>({})
  const [variantTranslations, setVariantTranslations] = useState<Record<string, { name: string }>>({})

  // Translation hooks
  const { data: languagesData } = useTenantLanguages()
  const saveTranslations = useSaveTranslations()
  const tenantLanguages = languagesData?.data?.languages || []

  // Fetch existing translations when editing a category
  const { data: existingCategoryTranslationsData } = useTranslationsByPrefix(
    editingCategory ? `variant_category.${editingCategory.id}` : ''
  )

  // Fetch existing translations when editing a variant
  const { data: existingVariantTranslationsData } = useTranslationsByPrefix(
    editingVariant ? `menu_item_variant.${editingVariant.id}` : ''
  )

  // Queries
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ['variant-categories'],
    queryFn: () => apiGet<{ data: { categories: VariantCategory[] } }>('/menu/variant-categories'),
  })

  const { data: variantsData, isLoading: loadingVariants } = useQuery({
    queryKey: ['menu-item-variants', menuItemId],
    queryFn: () => apiGet<{ data: { variants: MenuItemVariant[] } }>(`/menu/items/${menuItemId}/variants`),
  })

  const categories = categoriesData?.data?.categories || []
  const variants = variantsData?.data?.variants || []

  // Group variants by category
  const variantsByCategory = variants.reduce<Record<string, MenuItemVariant[]>>((acc, v) => {
    if (!acc[v.category_id]) acc[v.category_id] = []
    acc[v.category_id].push(v)
    return acc
  }, {})

  // Mutations
  const createCategory = useMutation({
    mutationFn: (data: { name: string; description?: string; is_required?: boolean; allow_multiple?: boolean }) =>
      apiPost<{ data: { category: VariantCategory } }>('/menu/variant-categories', data),
    onSuccess: async (data) => {
      if (data?.data?.category?.id) {
        await saveCategoryTranslationsAsync(data.data.category.id)
      }
      queryClient.invalidateQueries({ queryKey: ['variant-categories'] })
      toast.success(t('categoryCreated'))
      resetCategoryForm() // Keep modal open for adding more
    },
    onError: (error: any) => {
      toast.error(t('categoryCreateFailed'), { description: error?.message })
    },
  })

  const updateCategory = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; is_required?: boolean; allow_multiple?: boolean; is_active?: boolean }) =>
      apiPatch(`/menu/variant-categories/${id}`, data),
    onSuccess: async (_, variables) => {
      await saveCategoryTranslationsAsync(variables.id)
      queryClient.invalidateQueries({ queryKey: ['variant-categories'] })
      toast.success(t('categoryUpdated'))
      setEditingCategory(null)
      resetCategoryForm()
    },
    onError: (error: any) => {
      toast.error(t('categoryUpdateFailed'), { description: error?.message })
    },
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiDelete(`/menu/variant-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variant-categories'] })
      toast.success(t('categoryDeleted'))
    },
    onError: (error: any) => {
      toast.error(t('categoryDeleteFailed'), { description: error?.message })
    },
  })

  const createVariant = useMutation({
    mutationFn: (data: { category_id: string; name: string; price_adjustment?: number; is_default?: boolean }) =>
      apiPost<{ data: { variant: MenuItemVariant } }>(`/menu/items/${menuItemId}/variants`, data),
    onSuccess: async (data) => {
      if (data?.data?.variant?.id) {
        await saveVariantTranslationsAsync(data.data.variant.id)
      }
      queryClient.invalidateQueries({ queryKey: ['menu-item-variants', menuItemId] })
      toast.success(t('variantCreated'))
      // Keep modal open and category selected for adding more variants
      setVariantForm(prev => ({ ...prev, name: '', price_adjustment: '', is_default: false }))
      setVariantTranslations({})
    },
    onError: (error: any) => {
      toast.error(t('variantCreateFailed'), { description: error?.message })
    },
  })

  const updateVariant = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; price_adjustment?: number; is_default?: boolean; is_available?: boolean }) =>
      apiPatch(`/menu/items/${menuItemId}/variants/${id}`, data),
    onSuccess: async (_, variables) => {
      await saveVariantTranslationsAsync(variables.id)
      queryClient.invalidateQueries({ queryKey: ['menu-item-variants', menuItemId] })
      toast.success(t('variantUpdated'))
      setEditingVariant(null)
      resetVariantForm()
    },
    onError: (error: any) => {
      toast.error(t('variantUpdateFailed'), { description: error?.message })
    },
  })

  const deleteVariant = useMutation({
    mutationFn: (id: string) => apiDelete(`/menu/items/${menuItemId}/variants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-item-variants', menuItemId] })
      toast.success(t('variantDeleted'))
    },
    onError: (error: any) => {
      toast.error(t('variantDeleteFailed'), { description: error?.message })
    },
  })

  // Form handlers
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', is_required: false, allow_multiple: false })
    setCategoryTranslations({})
  }

  const resetVariantForm = () => {
    setVariantForm({ name: '', price_adjustment: '', category_id: '', is_default: false })
    setVariantTranslations({})
    setSelectedCategoryId(null)
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    createCategory.mutate({
      name: categoryForm.name,
      description: categoryForm.description || undefined,
      is_required: categoryForm.is_required,
      allow_multiple: categoryForm.allow_multiple,
    })
  }

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return
    updateCategory.mutate({
      id: editingCategory.id,
      name: categoryForm.name,
      description: categoryForm.description || undefined,
      is_required: categoryForm.is_required,
      allow_multiple: categoryForm.allow_multiple,
    })
  }

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault()
    createVariant.mutate({
      category_id: variantForm.category_id,
      name: variantForm.name,
      price_adjustment: parseFloat(variantForm.price_adjustment) || 0,
      is_default: variantForm.is_default,
    })
  }

  const handleUpdateVariant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVariant) return
    updateVariant.mutate({
      id: editingVariant.id,
      name: variantForm.name,
      price_adjustment: parseFloat(variantForm.price_adjustment) || 0,
      is_default: variantForm.is_default,
    })
  }

  // Effect to populate form when editing
  useEffect(() => {
    if (editingCategory) {
      setCategoryForm({
        name: editingCategory.name,
        description: editingCategory.description || '',
        is_required: editingCategory.is_required,
        allow_multiple: editingCategory.allow_multiple,
      })
    }
  }, [editingCategory])

  useEffect(() => {
    if (editingVariant) {
      setVariantForm({
        name: editingVariant.name,
        price_adjustment: editingVariant.price_adjustment.toString(),
        category_id: editingVariant.category_id,
        is_default: editingVariant.is_default,
      })
    }
  }, [editingVariant])

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

  // Populate variant translations when editing
  useEffect(() => {
    if (editingVariant && existingVariantTranslationsData?.data?.translations) {
      const translations: Record<string, { name: string }> = {}
      const existingTranslations = existingVariantTranslationsData.data.translations
      
      existingTranslations.forEach(t => {
        if (!translations[t.language_code]) {
          translations[t.language_code] = { name: '' }
        }
        if (t.key.endsWith('.name')) {
          translations[t.language_code].name = t.value
        }
      })
      
      setVariantTranslations(translations)
    }
  }, [editingVariant, existingVariantTranslationsData])

  // Helper to save category translations
  const saveCategoryTranslationsAsync = async (categoryId: string) => {
    const translationsToSave: { key: string; language_code: string; value: string }[] = []
    
    Object.entries(categoryTranslations).forEach(([langCode, values]) => {
      if (values.name) {
        translationsToSave.push({
          key: generateVariantCategoryTranslationKey(categoryId, 'name'),
          language_code: langCode,
          value: values.name,
        })
      }
      if (values.description) {
        translationsToSave.push({
          key: generateVariantCategoryTranslationKey(categoryId, 'description'),
          language_code: langCode,
          value: values.description,
        })
      }
    })
    
    if (translationsToSave.length > 0) {
      await saveTranslations.mutateAsync(translationsToSave)
    }
  }

  // Helper to save variant translations
  const saveVariantTranslationsAsync = async (variantId: string) => {
    const translationsToSave: { key: string; language_code: string; value: string }[] = []
    
    Object.entries(variantTranslations).forEach(([langCode, values]) => {
      if (values.name) {
        translationsToSave.push({
          key: generateMenuItemVariantTranslationKey(variantId, 'name'),
          language_code: langCode,
          value: values.name,
        })
      }
    })
    
    if (translationsToSave.length > 0) {
      await saveTranslations.mutateAsync(translationsToSave)
    }
  }

  const formatPrice = (amount: number) => {
    if (amount === 0) return t('included')
    const sign = amount > 0 ? '+' : ''
    return `${sign}${amount.toFixed(2)} ${currency}`
  }

  if (loadingCategories || loadingVariants) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">{t('description', { itemName: menuItemName })}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsAddCategoryOpen(true) }}>
            <Settings className="h-4 w-4 mr-1" />
            {t('manageCategories')}
          </Button>
          <Button type="button" size="sm" onClick={(e) => { e.stopPropagation(); setIsAddVariantOpen(true) }} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            {t('addVariant')}
          </Button>
        </div>
      </div>

      {/* Categories and Variants */}
      {categories.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">{t('noCategories')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('noCategoriesDesc')}</p>
          <Button type="button" onClick={(e) => { e.stopPropagation(); setIsAddCategoryOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            {t('createFirstCategory')}
          </Button>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {categories.filter(c => c.is_active).map((category) => {
            const categoryVariants = variantsByCategory[category.id] || []
            return (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryVariants.length} {t('variants')}
                    </Badge>
                    {category.is_required && (
                      <Badge variant="destructive" className="text-xs">{t('required')}</Badge>
                    )}
                    {category.allow_multiple && (
                      <Badge variant="outline" className="text-xs">{t('multiSelect')}</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {categoryVariants.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">{t('noVariantsInCategory')}</p>
                    ) : (
                      categoryVariants.map((variant) => (
                        <div
                          key={variant.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            !variant.is_available && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{variant.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(variant.price_adjustment)}
                                {variant.is_default && (
                                  <span className="ml-2 text-primary">({t('default')})</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={variant.is_available}
                              onCheckedChange={(checked) => updateVariant.mutate({ id: variant.id, is_available: checked })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); setEditingVariant(variant) }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'variant', item: variant }) }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCategoryId(category.id)
                        setVariantForm({ ...variantForm, category_id: category.id })
                        setIsAddVariantOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('addVariantToCategory', { category: category.name })}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog open={isAddCategoryOpen || !!editingCategory} onOpenChange={(open) => { if (!open) { setIsAddCategoryOpen(false); setEditingCategory(null); resetCategoryForm() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('editCategory') : t('addCategory')}</DialogTitle>
            <DialogDescription>{t('categoryDialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{t('basicInfo')}</TabsTrigger>
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4 mt-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>{t('categoryName')} *</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder={t('categoryNamePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('categoryDescription')}</Label>
                    <Input
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      placeholder={t('categoryDescPlaceholder')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('isRequired')}</Label>
                      <p className="text-sm text-muted-foreground">{t('isRequiredDesc')}</p>
                    </div>
                    <Switch
                      checked={categoryForm.is_required}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_required: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('allowMultiple')}</Label>
                      <p className="text-sm text-muted-foreground">{t('allowMultipleDesc')}</p>
                    </div>
                    <Switch
                      checked={categoryForm.allow_multiple}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, allow_multiple: checked })}
                    />
                  </div>

                  {/* Show existing categories if creating */}
                  {!editingCategory && categories.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-sm text-muted-foreground">{t('existingCategories')}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {categories.map((c) => (
                          <Badge key={c.id} variant="secondary" className="cursor-pointer" onClick={() => {
                            setEditingCategory(c)
                            setIsAddCategoryOpen(false)
                          }}>
                            {c.name}
                            <Edit className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Translations Tab */}
                <TabsContent value="translations" className="mt-0">
                  <TranslationEditor
                    languages={tenantLanguages}
                    translations={categoryTranslations}
                    onTranslationsChange={(vals) => setCategoryTranslations(vals as Record<string, { name: string; description: string }>)}
                    fields={[
                      { key: 'name', label: t('categoryName'), type: 'input', placeholder: t('categoryNamePlaceholder') },
                      { key: 'description', label: t('categoryDescription'), type: 'input', placeholder: t('categoryDescPlaceholder') },
                    ]}
                    defaultValues={{ name: categoryForm.name, description: categoryForm.description }}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-4 pt-4 border-t">
              {editingCategory && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteConfirm({ type: 'category', item: editingCategory })}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('deleteCategory')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => { setIsAddCategoryOpen(false); setEditingCategory(null); resetCategoryForm() }}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCategory ? t('saveCategory') : t('createCategory')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Variant Dialog */}
      <Dialog open={isAddVariantOpen || !!editingVariant} onOpenChange={(open) => { if (!open) { setIsAddVariantOpen(false); setEditingVariant(null); resetVariantForm() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingVariant ? t('editVariant') : t('addVariant')}</DialogTitle>
            <DialogDescription>{t('variantDialogDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={editingVariant ? handleUpdateVariant : handleCreateVariant} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">{t('basicInfo')}</TabsTrigger>
                <TabsTrigger value="translations" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('translations')}</span>
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4 mt-4">
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-0">
                  {!editingVariant && (
                    <div className="space-y-2">
                      <Label>{t('selectCategory')} *</Label>
                      <Select
                        value={variantForm.category_id}
                        onValueChange={(v) => setVariantForm({ ...variantForm, category_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('selectCategoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.is_active).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{t('variantName')} *</Label>
                    <Input
                      value={variantForm.name}
                      onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                      placeholder={t('variantNamePlaceholder')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('priceAdjustment')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={variantForm.price_adjustment}
                        onChange={(e) => setVariantForm({ ...variantForm, price_adjustment: e.target.value })}
                        placeholder="0.00"
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">{currency}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('priceAdjustmentDesc', { basePrice: basePrice.toFixed(2), currency })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t('isDefault')}</Label>
                      <p className="text-sm text-muted-foreground">{t('isDefaultDesc')}</p>
                    </div>
                    <Switch
                      checked={variantForm.is_default}
                      onCheckedChange={(checked) => setVariantForm({ ...variantForm, is_default: checked })}
                    />
                  </div>
                </TabsContent>

                {/* Translations Tab */}
                <TabsContent value="translations" className="mt-0">
                  <TranslationEditor
                    languages={tenantLanguages}
                    translations={variantTranslations}
                    onTranslationsChange={(vals) => setVariantTranslations(vals as Record<string, { name: string }>)}
                    fields={[
                      { key: 'name', label: t('variantName'), type: 'input', placeholder: t('variantNamePlaceholder') },
                    ]}
                    defaultValues={{ name: variantForm.name }}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsAddVariantOpen(false); setEditingVariant(null); resetVariantForm() }}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={createVariant.isPending || updateVariant.isPending || (!editingVariant && !variantForm.category_id)}>
                {(createVariant.isPending || updateVariant.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVariant ? t('saveVariant') : t('createVariant')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={deleteConfirm?.type === 'category' ? t('deleteCategory') : t('deleteVariant')}
        description={deleteConfirm?.type === 'category' ? t('deleteCategoryConfirm') : t('deleteVariantConfirm')}
        warningMessage={deleteConfirm?.type === 'category' && variantsByCategory[(deleteConfirm.item as VariantCategory).id]?.length > 0
          ? t('categoryHasVariants', { count: variantsByCategory[(deleteConfirm.item as VariantCategory).id].length })
          : undefined}
        onConfirm={() => {
          if (deleteConfirm?.type === 'category') {
            deleteCategory.mutate((deleteConfirm.item as VariantCategory).id)
          } else if (deleteConfirm?.type === 'variant') {
            deleteVariant.mutate((deleteConfirm.item as MenuItemVariant).id)
          }
          setDeleteConfirm(null)
        }}
        isLoading={deleteCategory.isPending || deleteVariant.isPending}
      />
    </div>
  )
}
