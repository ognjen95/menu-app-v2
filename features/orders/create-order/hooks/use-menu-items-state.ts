'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { MenuItemWithVariants, Category, CartItem } from '../types'
import type { SelectedVariantInfo } from '@/lib/hooks/use-variant-selection'

export const getItemQuantities = (cart: CartItem[]) => {
  return cart.reduce<Record<string, number>>((acc, item) => {
    const id = item.menuItem.id
    acc[id] = (acc[id] || 0) + item.quantity
    return acc
  }, {})
}

type UseMenuItemsStateProps = {
  menuItems: MenuItemWithVariants[]
}

export function useMenuItemsState({ menuItems }: UseMenuItemsStateProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [itemForVariants, setItemForVariants] = useState<MenuItemWithVariants | null>(null)

  const addFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Update quantity by menu item ID (for items without variants)
  const updateItemQuantity = useCallback((itemId: string, delta: number) => {
    setCart(prev => {
      const cartItem = prev.find(c => c.menuItem.id === itemId && (!c.selectedVariants || c.selectedVariants.length === 0))
      
      if (cartItem) {
        if (delta > 0) {
          return prev.map(c => 
            c.id === cartItem.id ? { ...c, quantity: c.quantity + delta } : c
          )
        } else {
          const newQty = cartItem.quantity + delta
          if (newQty <= 0) {
            return prev.filter(c => c.id !== cartItem.id)
          }
          return prev.map(c => 
            c.id === cartItem.id ? { ...c, quantity: newQty } : c
          )
        }
      } else if (delta > 0) {
        const menuItem = menuItems.find(m => m.id === itemId)
        if (menuItem) {
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            menuItem,
            selectedVariants: [],
            calculatedPrice: menuItem.base_price,
            quantity: delta,
          }
          return [...prev, newItem]
        }
      }
      return prev
    })
  }, [menuItems])

  // Remove one item from cart by menu item ID (removes last added)
  const removeOneByItemId = useCallback((itemId: string) => {
    setCart(prev => {
      const itemsForMenuItem = prev.filter(c => c.menuItem.id === itemId)
      if (itemsForMenuItem.length === 0) return prev
      
      const lastItem = itemsForMenuItem[itemsForMenuItem.length - 1]
      
      if (lastItem.quantity > 1) {
        return prev.map(c => 
          c.id === lastItem.id ? { ...c, quantity: c.quantity - 1 } : c
        )
      } else {
        return prev.filter(c => c.id !== lastItem.id)
      }
    })
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

  const resetMenuState = useCallback(() => {
    setSearchQuery('')
    setSelectedCategoryId(null)
  }, [])

  return {
    // Search & filter
    searchQuery,
    handleSearchChange,
    selectedCategoryId,
    setSelectedCategoryId,
    categories,
    filteredItems,
    menuItems,

    // Cart
    cart,
    cartTotal,
    cartItemsCount,
    itemQuantities,
    recentlyAddedId,
    addToCartDirect,
    handleItemClick,
    updateQuantity,
    updateItemQuantity,
    removeOneByItemId,
    removeFromCart,
    clearCart,

    // Variants
    itemForVariants,
    setItemForVariants,

    // Reset
    resetMenuState,
  }
}
