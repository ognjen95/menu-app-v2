'use client'

import { useState, useEffect } from 'react'
import { useMenus, useCategories, useMenuItems, useCreateMenu, useCreateCategory, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useAllergens } from '@/lib/hooks/use-menu'
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
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function MenuPage() {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
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

  // Dietary tag options
  const dietaryTagOptions = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free']

  const { data: menusData, isLoading: menusLoading } = useMenus()
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories(selectedMenuId || '')
  const { data: itemsData, isLoading: itemsLoading } = useMenuItems(selectedCategoryId || '')
  const { data: allergensData } = useAllergens()
  
  const createMenu = useCreateMenu()
  const createCategory = useCreateCategory()
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const menus = menusData?.data?.menus || []
  const allergens = allergensData?.data?.allergens || []
  const categories = categoriesData?.data?.categories || []
  const items = itemsData?.data?.items || []

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
  
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMenuId) return
    createCategory.mutate({ menuId: selectedMenuId, name: categoryForm.name, description: categoryForm.description }, {
      onSuccess: () => {
        setIsCreateCategoryOpen(false)
        setCategoryForm({ name: '', description: '' })
      }
    })
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

    if (editingItem) {
      // Update existing item
      updateItem.mutate({ 
        id: editingItem.id,
        categoryId,
        ...itemData,
      }, {
        onSuccess: () => {
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
        onSuccess: () => {
          setIsItemDialogOpen(false)
          resetItemForm()
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Create and manage your menus, categories, and items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button onClick={() => setIsItemDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menus sidebar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Menus</CardTitle>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsCreateMenuOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {menusLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : menus.length === 0 ? (
                <div className="text-sm text-muted-foreground">No menus yet</div>
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
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Categories</CardTitle>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!selectedMenuId} onClick={() => setIsCreateCategoryOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {!selectedMenuId ? (
                <div className="text-sm text-muted-foreground">Select a menu first</div>
              ) : categoriesLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No categories yet</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setIsCreateCategoryOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors group',
                      selectedCategoryId === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-grab" />
                      <span>{category.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <div className="lg:col-span-6">
          <Card className="h-full min-h-[400px]">
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedCategoryId 
                      ? categories.find(c => c.id === selectedCategoryId)?.name || 'Items'
                      : 'Items'}
                  </CardTitle>
                  <CardDescription>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </CardDescription>
                </div>
                <Button size="sm" disabled={!selectedCategoryId} onClick={() => setIsItemDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {!selectedCategoryId ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">Select a category to view items</p>
                </div>
              ) : itemsLoading ? (
                <div className="text-muted-foreground py-8">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-4">No items in this category</p>
                  <Button onClick={() => setIsItemDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-xl border hover:bg-accent/50 transition-colors group"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                      
                      {/* Image */}
                      <div className="relative h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          {item.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          {item.is_new && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">New</span>
                          )}
                          {!item.is_active && (
                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded">Hidden</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                              {item.item_allergens.length} allergens
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
                      <div className="text-right">
                        <div className="font-semibold">
                          €{item.base_price.toFixed(2)}
                        </div>
                        {item.compare_price && (
                          <div className="text-sm text-muted-foreground line-through">
                            €{item.compare_price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <DialogTitle>Create Menu</DialogTitle>
            <DialogDescription>Add a new menu to your restaurant</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMenu} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">Menu Name *</Label>
              <Input
                id="menu-name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                placeholder="Lunch Menu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-description">Description</Label>
              <Input
                id="menu-description"
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                placeholder="Available 11am - 3pm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateMenuOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMenu.isPending}>
                {createMenu.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Menu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>Add a new category to organize your menu items</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Appetizers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Start your meal with these delicious options"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={(open) => { setIsItemDialogOpen(open); if (!open) resetItemForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Create Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the details of this menu item' : 'Add a new item to your menu with all details'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitItem} className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="dietary">Dietary & Allergens</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 pr-4">
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Category selector - only show when creating and no category selected */}
                  {!editingItem && !selectedCategoryId && (
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={itemForm.category_id}
                        onValueChange={(value) => setItemForm(prev => ({ ...prev, category_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
                    <Label htmlFor="item-name">Item Name *</Label>
                    <Input
                      id="item-name"
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Margherita Pizza"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="item-description">Description</Label>
                    <Textarea
                      id="item-description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Fresh tomatoes, mozzarella, and basil"
                      rows={3}
                    />
                  </div>

                  {/* Image */}
                  <div className="space-y-2">
                    <Label>Image</Label>
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
                            <span className="text-sm">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload image</span>
                            <span className="text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</span>
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
                      <Label htmlFor="item-price">Price (€) *</Label>
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.base_price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, base_price: e.target.value }))}
                        placeholder="12.50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-compare-price">Compare Price (€)</Label>
                      <Input
                        id="item-compare-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemForm.compare_price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, compare_price: e.target.value }))}
                        placeholder="15.00"
                      />
                      <p className="text-xs text-muted-foreground">Original price for showing discount</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Preparation time & calories */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prep-time" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Prep Time (minutes)
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
                        Calories (kcal)
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
                      Item Status
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="is-active">Active</Label>
                          <p className="text-xs text-muted-foreground">Item is visible in menu</p>
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
                            Featured
                          </Label>
                          <p className="text-xs text-muted-foreground">Highlight this item</p>
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
                            New Item
                          </Label>
                          <p className="text-xs text-muted-foreground">Show &quot;New&quot; badge</p>
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
                      Dietary Tags
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
                      Allergens
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Select all allergens present in this item
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
              </ScrollArea>
            </Tabs>

            <DialogFooter className="mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => { setIsItemDialogOpen(false); resetItemForm() }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={(createItem.isPending || updateItem.isPending) || (!editingItem && !selectedCategoryId && !itemForm.category_id)}
              >
                {(createItem.isPending || updateItem.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? 'Update Item' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
