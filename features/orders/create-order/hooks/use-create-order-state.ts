'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { apiGet } from '@/lib/api'
import { useOfflineCreateOrder } from '@/lib/hooks/use-offline-orders'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import type { Location, Table } from '@/lib/types'
import type {
  CartItem,
  OrderType,
  CustomerInfoValues,
  MenuItemWithVariants,
  TeamMember,
  Category,
} from '../types'
import type { SelectedVariantInfo } from '@/lib/hooks/use-variant-selection'

const LOCATION_STORAGE_KEY = 'pos-selected-location'

export const getItemQuantities = (cart: CartItem[]) => {
  return cart.reduce<Record<string, number>>((acc, item) => {
    const id = item.menuItem.id
    acc[id] = (acc[id] || 0) + item.quantity
    return acc
  }, {})
}

type UseCreateOrderStateProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: (key: string) => string
  locations: Location[]
  tables: Table[]
  team: TeamMember[]
  menuItems: MenuItemWithVariants[]
}

export function useCreateOrderState({ open, onOpenChange, t, locations, tables, menuItems, team }: UseCreateOrderStateProps) {
  const customerInfoForm = useForm<CustomerInfoValues>({
    defaultValues: { name: '', phone: '', notes: '' },
  })

  // UI State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [mobileStep, setMobileStep] = useState<1 | 2>(1)
  const [isCustomerInfoOpen, setIsCustomerInfoOpen] = useState(false)
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false)
  const [itemForVariants, setItemForVariants] = useState<MenuItemWithVariants | null>(null)

  const addFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null)

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

  // Set first location if none selected
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  // Preselect current user as staff
  useEffect(() => {
    if (!open || team.length === 0 || selectedStaffId) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) {
        const currentMember = team.find(m => m.user_id === user.id)
        if (currentMember) {
          setSelectedStaffId(currentMember.user_id)
        }
      }
    })
  }, [open, team, selectedStaffId])

  // Extract unique categories from items
  const categories = useMemo<Category[]>(() => {
    const categoryMap = new Map<string, Category>()
    menuItems.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category.id, item.category)
      }
    })
    return Array.from(categoryMap.values())
  }, [menuItems])

  // Filter items by search and category
  const filteredItems = useMemo(() => {
    if (!menuItems) return []
    return menuItems.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategoryId ||
        item.category?.id === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategoryId])

  const itemQuantities = useMemo(() => getItemQuantities(cart), [cart])

  const triggerAddFeedback = useCallback((itemId: string) => {
    setRecentlyAddedId(itemId)
    if (addFeedbackTimeoutRef.current) {
      clearTimeout(addFeedbackTimeoutRef.current)
    }
    addFeedbackTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedId(null)
      addFeedbackTimeoutRef.current = null
    }, 600)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  // Add item to cart with optional variants
  const addToCartDirect = useCallback((
    item: MenuItemWithVariants,
    selectedVariants: SelectedVariantInfo[],
    calculatedPrice: number
  ) => {
    setCart(prev => {
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
    triggerAddFeedback(item.id)
  }, [triggerAddFeedback])

  // Handle item click (check for variants)
  const handleItemClick = useCallback((item: MenuItemWithVariants) => {
    if (item.menu_item_variants && item.menu_item_variants.length > 0) {
      setItemForVariants(item)
    } else {
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addFeedbackTimeoutRef.current) {
        clearTimeout(addFeedbackTimeoutRef.current)
      }
    }
  }, [])

  // Create order mutation (offline-aware)
  const createOrder = useOfflineCreateOrder()

  const handleCreateOrder = async () => {
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

    const customerInfoValues = customerInfoForm.getValues()

    // Find location and table names for local metadata
    const location = locations.find(l => l.id === selectedLocationId)
    const table = tables.find(t => t.id === selectedTableId)

    try {
      const result = await createOrder.mutateAsync({
        location_id: selectedLocationId,
        table_id: orderType === 'dine_in' ? selectedTableId : undefined,
        type: orderType,
        status: 'accepted',
        customer_name: customerInfoValues.name || undefined,
        customer_phone: customerInfoValues.phone || undefined,
        customer_notes: customerInfoValues.notes || undefined,
        items: cart.map(c => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes,
          selected_variants: c.selectedVariants,
          unit_price: c.calculatedPrice,
        })),
        // Add local metadata for offline display
        _localMetadata: {
          locationName: location?.name,
          tableName: table?.name,
          itemsCount: cart.reduce((sum, c) => sum + c.quantity, 0),
          total: cartTotal,
          createdAt: new Date().toISOString(),
        },
      })

      // Show appropriate toast based on online/offline status
      if (result.isOffline) {
        toast.info(t('orderCreated'), {
          description: 'Order saved offline. Will sync when connected.',
        })
      } else {
        toast.success(t('orderCreated'))
      }

      // Reset form
      setCart([])
      setSelectedTableId('')
      customerInfoForm.reset({ name: '', phone: '', notes: '' })
      onOpenChange(false)
    } catch (error: any) {
      toast.error(t('orderFailed'), {
        description: error?.message || 'Unknown error',
      })
    }
  }

  // Mobile search focus management
  useEffect(() => {
    if (
      isMobile &&
      mobileStep === 2 &&
      isMobileSearchFocused &&
      mobileSearchInputRef.current
    ) {
      const input = mobileSearchInputRef.current
      const length = input.value.length
      input.focus()
      input.setSelectionRange(length, length)
    }
  }, [isMobile, mobileStep, isMobileSearchFocused, searchQuery])

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedCategoryId(null)
      setShowCart(false)
      setMobileStep(1)
      customerInfoForm.reset({ name: '', phone: '', notes: '' })
    }
  }, [open, customerInfoForm])

  return {
    // Form
    customerInfoForm,

    // Selection state
    selectedLocationId,
    setSelectedLocationId,
    selectedTableId,
    setSelectedTableId,
    selectedStaffId,
    setSelectedStaffId,
    orderType,
    setOrderType,

    // Search & filter
    searchQuery,
    handleSearchChange,
    selectedCategoryId,
    setSelectedCategoryId,

    // Cart
    cart,
    cartTotal,
    cartItemsCount,
    itemQuantities,
    recentlyAddedId,
    addToCartDirect,
    handleItemClick,
    updateQuantity,
    removeFromCart,
    clearCart,

    // Variants
    itemForVariants,
    setItemForVariants,

    // Data
    locations,
    tables,
    team,
    categories,
    filteredItems,
    menuItems,

    // UI state
    isMobile,
    showCart,
    setShowCart,
    mobileStep,
    setMobileStep,
    isCustomerInfoOpen,
    setIsCustomerInfoOpen,
    isMobileSearchFocused,
    setIsMobileSearchFocused,
    mobileSearchInputRef,

    // Actions
    handleCreateOrder,
    isSubmitting: createOrder.isPending,
  }
}
