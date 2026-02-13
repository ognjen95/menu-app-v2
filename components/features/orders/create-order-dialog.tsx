'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useCreateOrder } from '@/lib/hooks/use-orders'
import { useVariantSelection, type SelectedVariantInfo, type MenuItemVariant } from '@/lib/hooks/use-variant-selection'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VariantSelector } from '@/components/ui/variant-selector'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  UtensilsCrossed,
  X,
  Store,
  Package,
  Truck,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import type { Location, Table, MenuItem, Category } from '@/lib/types'
import { CompactMenuItemsGridSkeleton, CategoryButtonsRowSkeleton } from '@/components/ui/skeletons'

const LOCATION_STORAGE_KEY = 'pos-selected-location'

type MenuItemWithVariants = MenuItem & {
  category?: { id: string; name: string }
  menu_item_variants?: MenuItemVariant[]
}

type CartItem = {
  id: string
  menuItem: MenuItemWithVariants
  quantity: number
  notes?: string
  selectedVariants?: SelectedVariantInfo[]
  calculatedPrice: number
}

type OrderType = 'dine_in' | 'takeaway' | 'delivery'

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const t = useTranslations('createOrder')
  const tCommon = useTranslations('common')

  // State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1) // 1 = setup, 2 = menu

  // Variant selection dialog state
  const [itemForVariants, setItemForVariants] = useState<MenuItemWithVariants | null>(null)

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (saved) {
      setSelectedLocationId(saved)
    }
  }, [])

  // Save location to localStorage
  useEffect(() => {
    if (selectedLocationId) {
      localStorage.setItem(LOCATION_STORAGE_KEY, selectedLocationId)
    }
  }, [selectedLocationId])

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
    enabled: open,
  })
  const locations = useMemo(() => locationsData?.data?.locations || [], [locationsData])

  // Set first location if none selected
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  // Fetch tables for selected location
  const { data: tablesData } = useQuery({
    queryKey: ['tables', selectedLocationId],
    queryFn: () => apiGet<{ data: { tables: Table[] } }>('/tables', { location_id: selectedLocationId }),
    enabled: open && !!selectedLocationId,
  })
  const tables = useMemo(() => tablesData?.data?.tables || [], [tablesData])

  // Fetch team members
  const { data: teamData } = useQuery({
    queryKey: ['team'],
    queryFn: () => apiGet<{ data: { members: Array<{ id: string; user_id: string; role: string; profiles: { full_name: string | null; avatar_url: string | null } }> } }>('/team'),
    enabled: open,
  })
  const teamMembers = useMemo(() => teamData?.data?.members || [], [teamData])

  // Fetch current user profile to preselect
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet<{ data: { profile: { id: string; full_name: string } } }>('/profile'),
    enabled: open,
  })

  // Preselect current user as staff
  useEffect(() => {
    if (profileData?.data?.profile?.id && teamMembers.length > 0 && !selectedStaffId) {
      const currentMember = teamMembers.find(m => m.user_id === profileData.data.profile.id)
      if (currentMember) {
        setSelectedStaffId(currentMember.user_id)
      }
    }
  }, [profileData, teamMembers, selectedStaffId])

  // Fetch menu items
  const { data: menuItemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['menu-items-all'],
    queryFn: () => apiGet<{ data: { items: MenuItemWithVariants[] } }>('/menu/items'),
    enabled: open,
  })
  const menuItems = useMemo(() => menuItemsData?.data?.items || [], [menuItemsData])

  // Extract unique categories from items
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>()
    menuItems.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category.id, item.category)
      }
    })
    return Array.from(categoryMap.values())
  }, [menuItems])

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategoryId ||
        item.category?.id === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategoryId])

  // Add item to cart with optional variants
  const addToCartDirect = useCallback((
    item: MenuItemWithVariants,
    selectedVariants: SelectedVariantInfo[],
    calculatedPrice: number
  ) => {
    setCart(prev => {
      // Create a unique key based on item ID and selected variants
      const variantKey = selectedVariants.map(v => v.id).sort().join(',')
      const existing = prev.find(c =>
        c.menuItem.id === item.id &&
        (c.selectedVariants?.map(v => v.id).sort().join(',') || '') === variantKey
      )

      if (existing) {
        return prev.map(c =>
          c.id === existing.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, {
        id: crypto.randomUUID(),
        menuItem: item,
        quantity: 1,
        selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
        calculatedPrice,
      }]
    })
  }, [])

  // Handle item click (check for variants)
  const handleItemClick = useCallback((item: MenuItemWithVariants) => {
    if (item.menu_item_variants && item.menu_item_variants.length > 0) {
      // Open variant selection dialog
      setItemForVariants(item)
    } else {
      // No variants, add directly
      addToCartDirect(item, [], item.base_price)
    }
  }, [addToCartDirect])

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(c => {
        if (c.id === cartItemId) {
          const newQty = c.quantity + delta
          return newQty > 0 ? { ...c, quantity: newQty } : c
        }
        return c
      }).filter(c => c.quantity > 0 || delta >= 0)

      // Remove if quantity is 0
      if (delta < 0) {
        return updated.filter(c => c.quantity > 0)
      }
      return updated
    })
  }, [])

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartItemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Calculate totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.calculatedPrice * item.quantity), 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Create order mutation
  const createOrder = useCreateOrder()

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      toast.error(t('selectLocation'))
      return
    }
    if (cart.length === 0) {
      toast.error(t('addItemsFirst'))
      return
    }
    if (orderType === 'dine_in' && !selectedTableId) {
      toast.error(t('selectTable'))
      return
    }

    try {
      await createOrder.mutateAsync({
        location_id: selectedLocationId,
        table_id: orderType === 'dine_in' ? selectedTableId : undefined,
        type: orderType,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        customer_notes: customerNotes || undefined,
        items: cart.map(c => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes,
          selected_variants: c.selectedVariants,
          unit_price: c.calculatedPrice,
        })),
      })

      toast.success(t('orderCreated'))

      // Reset form
      setCart([])
      setSelectedTableId('')
      setCustomerName('')
      setCustomerPhone('')
      setCustomerNotes('')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(t('orderFailed'), {
        description: error?.message || 'Unknown error',
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedCategoryId(null)
      setShowCart(false)
    }
  }, [open])

  // Menu items grid component
  const MenuItemsGrid = () => {
    if (isLoadingItems) {
      return <CompactMenuItemsGridSkeleton count={8} />
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.is_sold_out}
            className={cn(
              "relative flex gap-3 p-3 rounded-lg border text-left transition-all",
              "hover:border-primary hover:shadow-sm active:scale-[0.98]",
              item.is_sold_out && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Product image */}
            <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
              {item.image_urls && item.image_urls[0] ? (
                <Image
                  src={item.image_urls[0]}
                  alt={item.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm line-clamp-2">{item.name}</span>
              <span className="text-xs text-muted-foreground block">
                {item.category?.name}
              </span>
              <span className="font-semibold text-sm">
                €{item.base_price.toFixed(2)}
              </span>
            </div>
            {item.is_sold_out && (
              <Badge variant="destructive" className="absolute top-1 right-1 text-xs">
                {t('soldOut')}
              </Badge>
            )}
            {!item.is_sold_out && item.menu_item_variants && item.menu_item_variants.length > 0 && (
              <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                <Settings2 className="h-3 w-3 mr-0.5" />
                {t('hasVariants')}
              </Badge>
            )}
          </button>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t('noItemsFound')}
          </div>
        )}
      </div>
    )
  }

  // Cart sidebar component
  const CartSidebar = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col h-full bg-muted/30", className)}>
      {/* Cart header */}
      <div className="p-4 border-b flex items-center">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">{t('cart')}</span>
          {cartItemsCount > 0 && (
            <Badge variant="secondary">{cartItemsCount}</Badge>
          )}
        </div>
      </div>

      {/* Cart items */}
      <ScrollArea className="flex-1 p-4">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('cartEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-background p-3 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                  {item.selectedVariants && item.selectedVariants.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.selectedVariants.map(v => v.name).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    €{(item.calculatedPrice * item.quantity).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 text-destructive ml-3"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-3 border-t">
              <Button className='w-full' variant='secondary' size="lg" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('clear')}
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Order details */}
      {cart.length > 0 && (
        <div className="p-4 pb-8 border-t space-y-3 safe-area-pb">
          {/* Customer info (optional) */}
          <Accordion type="single" collapsible>
            <AccordionItem value="customer-info" className="border rounded-lg">
              <AccordionTrigger className="px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{t('customerInfo')}</span>
                  {(customerName || customerPhone || customerNotes) && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {[customerName, customerPhone, customerNotes].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3 space-y-2">
                <Input
                  placeholder={t('customerName')}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder={t('customerPhone')}
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder={t('notes')}
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  className="h-9"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-semibold pt-2 border-t">
            <span>{t('total')}</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          {/* Submit */}
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={createOrder.isPending || cart.length === 0}
          >
            {createOrder.isPending ? t('creating') : t('placeOrder')}
          </Button>
        </div>
      )}
    </div>
  )

  // Main content
  const MainContent = () => (
    <div className="flex flex-col h-full">
      {/* Top bar - Location, Table, Staff, Order Type */}
      <div className="p-4 border-b space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Location */}
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="h-10">
              <MapPin className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder={t('selectLocation')} />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Table (only for dine_in) */}
          {orderType === 'dine_in' && (
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger className="h-10">
                <UtensilsCrossed className="h-4 w-4 mr-2 shrink-0" />
                <SelectValue placeholder={t('selectTable')} />
              </SelectTrigger>
              <SelectContent>
                {tables.map(table => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} {table.zone && `(${table.zone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Staff */}
          <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
            <SelectTrigger className="h-10">
              <User className="h-4 w-4 mr-2 shrink-0" />
              <SelectValue placeholder={t('selectStaff')} />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map(member => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{member.profiles?.full_name || member.role}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Order type tabs */}
        <div className="flex gap-2">
          <Button
            variant={orderType === 'dine_in' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setOrderType('dine_in')}
            className="flex-1"
          >
            <Store className="h-4 w-4 mr-2" />
            {t('dineIn')}
          </Button>
          <Button
            variant={orderType === 'takeaway' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setOrderType('takeaway')}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            {t('takeaway')}
          </Button>
          <Button
            variant={orderType === 'delivery' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setOrderType('delivery')}
            className="flex-1"
          >
            <Truck className="h-4 w-4 mr-2" />
            {t('delivery')}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Category filter */}
        <ScrollArea className="w-full whitespace-nowrap">
          {isLoadingItems ? (
            <CategoryButtonsRowSkeleton count={6} />
          ) : (
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedCategoryId === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
              >
                {t('allCategories')}
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 p-4">
        <MenuItemsGrid />
      </ScrollArea>

      {/* Mobile cart button */}
      {isMobile && cartItemsCount > 0 && (
        <div className="p-4 pb-8 border-t safe-area-pb">
          <Button
            className="w-full h-12"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile Setup Step (Step 1 - Location, Staff, Order Type, Table)
  const MobileSetupStep = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId)
    const selectedStaff = teamMembers.find(m => m.user_id === selectedStaffId)

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4">
            {/* Location & Staff Accordions */}
            <Accordion type="multiple" className="space-y-2">
              {/* Location Accordion */}
              <AccordionItem value="location" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-left">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('selectLocation')}</span>
                      <span className="font-medium">
                        {selectedLocation?.name || t('selectLocation')}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {locations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-left transition-all",
                          selectedLocationId === loc.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium">{loc.name}</span>
                        {selectedLocationId === loc.id && (
                          <Check className="h-4 w-4 text-primary float-right" />
                        )}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Staff Accordion */}
              <AccordionItem value="staff" className="border rounded-lg px-3">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-left">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{t('selectStaff')}</span>
                      <div className="flex items-center gap-2">
                        {selectedStaff && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={selectedStaff.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(selectedStaff.profiles?.full_name || selectedStaff.role).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="font-medium">
                          {selectedStaff?.profiles?.full_name || selectedStaff?.role || t('selectStaff')}
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    {teamMembers.map(member => (
                      <button
                        key={member.user_id}
                        onClick={() => setSelectedStaffId(member.user_id)}
                        className={cn(
                          "p-3 rounded-lg border-2 flex items-center gap-2 transition-all",
                          selectedStaffId === member.user_id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate flex-1">{member.profiles?.full_name || member.role}</span>
                        {selectedStaffId === member.user_id && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Order Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t('orderType')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOrderType('dine_in')}
                  className={cn(
                    "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
                    orderType === 'dine_in'
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Store className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('dineIn')}</span>
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={cn(
                    "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
                    orderType === 'takeaway'
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('takeaway')}</span>
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={cn(
                    "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
                    orderType === 'delivery'
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Truck className="h-5 w-5" />
                  <span className="text-sm font-medium">{t('delivery')}</span>
                </button>
              </div>
            </div>

            {/* Table Selection (only for dine_in) */}
            {orderType === 'dine_in' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  {t('selectTableTitle')}
                </label>
                {tables.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {tables.map(table => (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all",
                          selectedTableId === table.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="font-medium text-sm">{table.name}</span>
                        {table.zone && (
                          <span className="block text-xs opacity-70">{table.zone}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('noTablesAvailable')}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Continue button - fixed at bottom */}
        <div className="shrink-0 p-4 pb-10 bg-background border-t">
          <Button
            className="w-full h-12 text-lg"
            onClick={() => setMobileStep(2)}
            disabled={!selectedLocationId || !selectedStaffId || (orderType === 'dine_in' && !selectedTableId)}
          >
            {t('continue')}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Mobile Menu Step (Step 2 - Menu items)
  const MobileMenuStep = () => (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 border-b space-y-3">
        {/* Order info badge */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {locations.find(l => l.id === selectedLocationId)?.name}
          </span>
          {orderType === 'dine_in' && selectedTableId && (
            <span className="px-2 py-1 bg-muted rounded-md flex items-center gap-1">
              <UtensilsCrossed className="h-3 w-3" />
              {tables.find(t => t.id === selectedTableId)?.name}
            </span>
          )}
          <span className="px-2 py-1 bg-muted rounded-md">
            {orderType === 'dine_in' ? t('dineIn') : orderType === 'takeaway' ? t('takeaway') : t('delivery')}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchItems')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Category filter */}
        <ScrollArea className="w-full whitespace-nowrap">
          {isLoadingItems ? (
            <CategoryButtonsRowSkeleton count={6} />
          ) : (
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedCategoryId === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
              >
                {t('allCategories')}
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Menu items */}
      <ScrollArea className="flex-1 p-4">
        <MenuItemsGrid />
      </ScrollArea>

      {/* Mobile cart button */}
      {cartItemsCount > 0 && (
        <div className="p-4 pb-8 border-t safe-area-pb">
          <Button
            className="w-full h-12"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {t('viewCart')} ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )

  // Variant Selection Dialog Component (defined before views)
  const VariantSelectionContent = () => {
    const {
      selectedVariants,
      variantsByCategory,
      handleVariantClick,
      totalPrice,
      getSelectedVariantInfos,
      isValid,
    } = useVariantSelection({
      variants: itemForVariants?.menu_item_variants,
      basePrice: itemForVariants?.base_price || 0,
      itemId: itemForVariants?.id,
    })

    const handleAddToCartWithVariants = () => {
      if (!itemForVariants) return
      const variantInfos = getSelectedVariantInfos()
      addToCartDirect(itemForVariants, variantInfos, totalPrice)
      setItemForVariants(null)
    }

    if (!itemForVariants) return null

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {itemForVariants.name}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <VariantSelector
            variantsByCategory={variantsByCategory}
            selectedVariants={selectedVariants}
            onVariantClick={handleVariantClick}
            translations={{
              selectMultiple: t('selectMultiple'),
            }}
          />
        </div>
        <DialogFooter className="p-4 border-t">
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-bold">€{totalPrice.toFixed(2)}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setItemForVariants(null)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleAddToCartWithVariants} disabled={!isValid()}>
                <Plus className="h-4 w-4 mr-1" />
                {t('addToCart')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </>
    )
  }

  // Mobile view with Sheet for cart
  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={(isOpen) => {
          if (!isOpen) setMobileStep(1) // Reset to step 1 when closing
          onOpenChange(isOpen)
        }}>
          <SheetContent side="bottom" className="max-h-[100dvh] h-[95dvh] p-0 flex flex-col rounded-3xl" >
            <SheetHeader className="p-4 border-b shrink-0">
              <SheetTitle className="flex items-center gap-2">
                {mobileStep === 2 && (
                  <Button
                    onClick={() => setMobileStep(1)}
                    variant="ghost"
                    className="mr-1 hover:bg-muted -ml-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <UtensilsCrossed className="h-5 w-5" />
                {mobileStep === 1 ? t('orderSetup') : t('title')}
              </SheetTitle>
              <p className="text-sm text-muted-foreground">
                {t('step', { current: mobileStep, total: 2 })}
              </p>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobileStep === 1 ? <MobileSetupStep /> : <MobileMenuStep />}
            </div>
          </SheetContent>
        </Sheet>

        {/* Cart sheet for mobile */}
        <Sheet open={showCart} onOpenChange={setShowCart}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 max-h-[100dvh] flex flex-col">
            <CartSidebar />
          </SheetContent>
        </Sheet>

        {/* Variant Selection Dialog for mobile */}
        <Dialog open={!!itemForVariants} onOpenChange={(open) => !open && setItemForVariants(null)}>
          <DialogContent className="max-w-md">
            <VariantSelectionContent />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop view with Dialog
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-[80vw] max-h-[100vh] min-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              {t('title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Menu section */}
            <div className="flex-1 border-r">
              <MainContent />
            </div>

            {/* Cart sidebar */}
            <div className="w-80 lg:w-96">
              <CartSidebar />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <Dialog open={!!itemForVariants} onOpenChange={(open) => !open && setItemForVariants(null)}>
        <DialogContent className="max-w-md">
          <VariantSelectionContent />
        </DialogContent>
      </Dialog>
    </>
  )
}
