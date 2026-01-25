'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Leaf,
  AlertTriangle,
  Star,
  Clock,
  Flame,
  Trash2,
} from 'lucide-react'
import type { Tenant, Menu, MenuItem, Allergen, Location, Website } from '@/lib/types'
import { CheckoutDialog } from './checkout-dialog'
import Image from 'next/image'

type MenuWithCategories = Menu & {
  categories: (CategoryWithItems)[]
}

type CategoryWithItems = {
  id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  items: MenuItemWithRelations[]
}

type MenuItemWithRelations = MenuItem & {
  variants?: { id: string; name: string; price_modifier: number; is_default: boolean }[]
  option_groups?: {
    id: string
    name: string
    is_required: boolean
    min_selections: number
    max_selections: number
    options: { id: string; name: string; price: number; is_default: boolean }[]
  }[]
  item_allergens?: { allergen_id: string; allergens: Allergen }[]
}

type CartItem = {
  id: string
  item: MenuItemWithRelations
  variant?: { id: string; name: string; price_modifier: number }
  selectedOptions: { id: string; name: string; price: number }[]
  quantity: number
  notes?: string
}

interface PublicMenuViewProps {
  tenant: Tenant
  menus: MenuWithCategories[]
  locations: Location[]
  allergens: Allergen[]
  website: Website | null
  tableId?: string
  locationId?: string
}

export function PublicMenuView({
  tenant,
  menus,
  locations,
  allergens,
  website,
  tableId,
  locationId,
}: PublicMenuViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null)
  const [cartAnimation, setCartAnimation] = useState<number[]>([])

  // Theme from website settings
  const theme = {
    primary: website?.primary_color || '#3B82F6',
    secondary: website?.secondary_color || '#F4F4F5',
    background: website?.background_color || '#FFFFFF',
    foreground: website?.foreground_color || '#18181B',
    accent: website?.accent_color || '#F97316',
    fontHeading: website?.font_heading || 'Inter',
    fontBody: website?.font_body || 'Inter',
  }

  // Calculate contrasting text color (returns hex)
  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  // Lighten/darken a color
  const adjustColor = (hex: string, percent: number): string => {
    const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) + percent))
    const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) + percent))
    const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) + percent))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  // Calculate muted foreground (50% opacity simulation)
  const mutedForeground = adjustColor(theme.foreground, theme.foreground === '#FFFFFF' || theme.foreground === '#ffffff' ? -100 : 100)

  // Derive card background (slightly different from main background)
  const cardBg = adjustColor(theme.background, theme.background === '#FFFFFF' || theme.background === '#ffffff' ? -10 : 20)
  const borderColor = adjustColor(theme.background, theme.background === '#FFFFFF' || theme.background === '#ffffff' ? -30 : 40)

  // Flatten all categories and items
  const allCategories = useMemo(() => {
    return menus.flatMap(menu => 
      menu.categories.filter(cat => cat.is_active)
    ).sort((a, b) => a.sort_order - b.sort_order)
  }, [menus])

  const allItems = useMemo(() => {
    return allCategories.flatMap(cat => 
      cat.items.filter(item => item.is_active && !item.is_sold_out)
    )
  }, [allCategories])

  // Filter items
  const filteredItems = useMemo(() => {
    let items = selectedCategory
      ? allCategories.find(c => c.id === selectedCategory)?.items || []
      : allItems

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    if (selectedFilters.length > 0) {
      items = items.filter(item =>
        selectedFilters.every(filter => item.dietary_tags?.includes(filter))
      )
    }

    return items.filter(item => item.is_active && !item.is_sold_out)
  }, [allItems, allCategories, selectedCategory, searchQuery, selectedFilters])

  // Cart functions
  const addToCart = (item: MenuItemWithRelations, variant?: CartItem['variant'], options: CartItem['selectedOptions'] = []) => {
    const cartItem: CartItem = {
      id: `${item.id}-${variant?.id || 'default'}-${options.map(o => o.id).join('-')}`,
      item,
      variant,
      selectedOptions: options,
      quantity: 1,
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === cartItem.id)
      if (existing) {
        return prev.map(i => i.id === cartItem.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, cartItem]
    })

    // Trigger +1 animation
    const animationId = Date.now()
    setCartAnimation(prev => [...prev, animationId])
    setTimeout(() => {
      setCartAnimation(prev => prev.filter(id => id !== animationId))
    }, 800)
  }

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = item.quantity + delta
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId))
  }

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.item.base_price + (item.variant?.price_modifier || 0)
      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      return total + (itemPrice + optionsPrice) * item.quantity
    }, 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: theme.background, 
        color: theme.foreground,
        fontFamily: `${theme.fontBody}, sans-serif`,
      }}
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40"
        style={{ 
          backgroundColor: theme.background, 
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo_url && (
                <Image
                  src={tenant.logo_url}
                  alt={tenant.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="font-bold text-lg" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{tenant.name}</h1>
                {tableId && (
                  <p className="text-sm" style={{ color: mutedForeground }}>Table ordering</p>
                )}
              </div>
            </div>
            
            <button
              className={`relative p-2 rounded-md ${cartAnimation.length > 0 ? 'animate-cart-shake' : ''}`}
              style={{ 
                border: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                color: theme.foreground,
              }}
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span 
                  key={cartItemsCount}
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs flex items-center justify-center animate-cart-bounce"
                  style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                >
                  {cartItemsCount}
                </span>
              )}
              {/* +1 confetti animation */}
              {cartAnimation.map((id) => (
                <span
                  key={id}
                  className="absolute pointer-events-none font-extrabold text-lg animate-cart-pop"
                  style={{
                    color: theme.primary,
                    top: '-4px',
                    right: '-4px',
                    textShadow: `0 1px 2px rgba(0,0,0,0.3), 0 0 8px ${theme.primary}66`,
                  }}
                >
                  +1
                </span>
              ))}
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedForeground }} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md"
              style={{ 
                backgroundColor: cardBg, 
                border: `1px solid ${borderColor}`,
                color: theme.foreground,
              }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="overflow-x-auto scrollbar-hide" style={{ borderTop: `1px solid ${borderColor}` }}>
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-2">
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
                style={{ 
                  backgroundColor: selectedCategory === null ? theme.primary : 'transparent',
                  color: selectedCategory === null ? getContrastColor(theme.primary) : theme.foreground,
                }}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  className="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
                  style={{ 
                    backgroundColor: selectedCategory === category.id ? theme.primary : 'transparent',
                    color: selectedCategory === category.id ? getContrastColor(theme.primary) : theme.foreground,
                  }}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Menu items */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Dietary filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['vegetarian', 'vegan', 'gluten-free', 'halal'].map((filter) => (
            <button
              key={filter}
              className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              style={{ 
                backgroundColor: selectedFilters.includes(filter) ? theme.primary : 'transparent',
                color: selectedFilters.includes(filter) ? getContrastColor(theme.primary) : theme.foreground,
                border: `1px solid ${selectedFilters.includes(filter) ? theme.primary : borderColor}`,
              }}
              onClick={() => {
                setSelectedFilters(prev =>
                  prev.includes(filter)
                    ? prev.filter(f => f !== filter)
                    : [...prev, filter]
                )
              }}
            >
              {filter === 'vegetarian' && <Leaf className="h-3 w-3" />}
              {filter}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: mutedForeground }}>No items found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const itemAllergens = item.item_allergens?.map(ia => ia.allergens) || []
              
              return (
                <div
                  key={item.id}
                  className="rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                  style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image - fixed height */}
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <div className="h-40 flex-shrink-0" style={{ backgroundColor: theme.secondary }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image_urls[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: theme.secondary }}>
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold truncate" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{item.name}</h3>
                          {item.is_featured && (
                            <Star className="h-4 w-4 fill-current" style={{ color: theme.accent }} />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm line-clamp-2 mt-1" style={{ color: mutedForeground }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold whitespace-nowrap" style={{ color: theme.primary }}>
                          €{item.base_price.toFixed(2)}
                        </span>
                        {item.compare_price && item.compare_price > item.base_price && (
                          <div className="text-xs line-through" style={{ color: mutedForeground }}>
                            €{item.compare_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags and info - limited to prevent overflow */}
                    {(item.is_new || (item.compare_price && item.compare_price > item.base_price) || item.dietary_tags?.length || itemAllergens.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-3 max-h-14 overflow-hidden">
                        {item.is_new && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>New</span>
                        )}
                        {item.compare_price && item.compare_price > item.base_price && (
                          <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>Sale</span>
                        )}
                        {item.dietary_tags?.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 max-w-24 truncate" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                            <Leaf className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{tag}</span>
                          </span>
                        ))}
                        {itemAllergens.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                            <AlertTriangle className="h-3 w-3" />
                            {itemAllergens.length}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add to cart button */}
                    <div className="mt-auto pt-5">
                      <button
                        className="w-full py-2.5 px-4 rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                        style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.variants?.length || item.option_groups?.length) {
                            setSelectedItem(item)
                          } else {
                            addToCart(item)
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add to order
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Cart floating button (mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
          <button
            className="w-full h-14 text-lg rounded-md font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            View order ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </button>
        </div>
      )}

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: `${theme.background}cc` }}>
          <div 
            className="fixed right-0 top-0 bottom-0 w-full max-w-md shadow-xl"
            style={{ backgroundColor: theme.background, borderLeft: `1px solid ${borderColor}` }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>Your Order</h2>
                <button 
                  className="p-2 rounded-md"
                  style={{ color: theme.foreground }}
                  onClick={() => setCartOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4" style={{ color: mutedForeground }} />
                    <p style={{ color: mutedForeground }}>Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((cartItem) => {
                      const itemPrice = cartItem.item.base_price + (cartItem.variant?.price_modifier || 0)
                      const optionsPrice = cartItem.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
                      const totalPrice = (itemPrice + optionsPrice) * cartItem.quantity

                      return (
                        <div key={cartItem.id} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: cardBg }}>
                          <div className="flex-1">
                            <h4 className="font-medium" style={{ color: theme.foreground }}>{cartItem.item.name}</h4>
                            {cartItem.variant && (
                              <p className="text-sm" style={{ color: mutedForeground }}>{cartItem.variant.name}</p>
                            )}
                            {cartItem.selectedOptions.length > 0 && (
                              <p className="text-sm" style={{ color: mutedForeground }}>
                                + {cartItem.selectedOptions.map(o => o.name).join(', ')}
                              </p>
                            )}
                            <p className="font-semibold mt-1" style={{ color: theme.foreground }}>€{totalPrice.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="h-8 w-8 rounded-md flex items-center justify-center"
                              style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                              onClick={() => updateCartQuantity(cartItem.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium" style={{ color: theme.foreground }}>{cartItem.quantity}</span>
                            <button
                              className="h-8 w-8 rounded-md flex items-center justify-center"
                              style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                              onClick={() => updateCartQuantity(cartItem.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              className="h-8 w-8 rounded-md flex items-center justify-center ml-1"
                              style={{ color: '#EF4444' }}
                              onClick={() => removeFromCart(cartItem.id)}
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="p-4 space-y-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                  <div className="flex justify-between text-lg font-bold" style={{ color: theme.foreground }}>
                    <span>Total</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    className="w-full h-12 text-lg rounded-md font-medium"
                    style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                    onClick={() => {
                      setCartOpen(false)
                      setCheckoutOpen(true)
                    }}
                  >
                    Place Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item detail modal would go here */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: `${theme.background}cc` }}
        >
          <div 
            className="rounded-xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ 
              backgroundColor: theme.background,
              border: `1px solid ${borderColor}`,
              boxShadow: `0 25px 50px -12px ${theme.foreground}33`,
            }}
          >
            {/* Item image */}
            {selectedItem.image_urls && selectedItem.image_urls.length > 0 && (
              <div className="aspect-video">
                <img
                  src={selectedItem.image_urls[0]}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover rounded-t-xl"
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{selectedItem.name}</h2>
                    {selectedItem.is_featured && (
                      <Star className="h-5 w-5 fill-current" style={{ color: theme.accent }} />
                    )}
                  </div>
                  {selectedItem.description && (
                    <p className="mt-1" style={{ color: mutedForeground }}>{selectedItem.description}</p>
                  )}
                </div>
                <button 
                  className="p-2 rounded-md"
                  style={{ color: theme.foreground }}
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Price section */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold" style={{ color: theme.primary }}>
                  €{selectedItem.base_price.toFixed(2)}
                </span>
                {selectedItem.compare_price && selectedItem.compare_price > selectedItem.base_price && (
                  <span className="text-lg line-through" style={{ color: mutedForeground }}>
                    €{selectedItem.compare_price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedItem.is_new && (
                  <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>New</span>
                )}
                {selectedItem.compare_price && selectedItem.compare_price > selectedItem.base_price && (
                  <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>
                    Save €{(selectedItem.compare_price - selectedItem.base_price).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Info row: prep time, calories */}
              {(selectedItem.preparation_time || selectedItem.calories) && (
                <div className="flex flex-wrap gap-4 mb-4 py-3 px-4 rounded-lg" style={{ backgroundColor: cardBg }}>
                  {selectedItem.preparation_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" style={{ color: mutedForeground }} />
                      <span className="text-sm" style={{ color: theme.foreground }}>{selectedItem.preparation_time} min</span>
                    </div>
                  )}
                  {selectedItem.calories && (
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4" style={{ color: mutedForeground }} />
                      <span className="text-sm" style={{ color: theme.foreground }}>{selectedItem.calories} kcal</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dietary tags */}
              {selectedItem.dietary_tags && selectedItem.dietary_tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-sm" style={{ color: theme.foreground }}>Dietary</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.dietary_tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                        <Leaf className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {selectedItem.item_allergens && selectedItem.item_allergens.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-1" style={{ color: theme.foreground }}>
                    <AlertTriangle className="h-4 w-4" style={{ color: theme.accent }} />
                    Allergens
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.item_allergens.map((ia) => (
                      <span key={ia.allergen_id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: cardBg, color: theme.foreground }}>
                        {ia.allergens.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.variants.map((variant) => (
                      <span
                        key={variant.id}
                        className="cursor-pointer px-4 py-2 rounded-md"
                        style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                      >
                        {variant.name}
                        {variant.price_modifier > 0 && ` (+€${variant.price_modifier.toFixed(2)})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Option groups */}
              {selectedItem.option_groups?.map((group) => (
                <div key={group.id} className="mb-6">
                  <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>
                    {group.name}
                    {group.is_required && <span style={{ color: '#EF4444' }} className="ml-1">*</span>}
                  </h3>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                        style={{ backgroundColor: cardBg, color: theme.foreground }}
                      >
                        <span>{option.name}</span>
                        <span style={{ color: mutedForeground }}>
                          {option.price > 0 && `+€${option.price.toFixed(2)}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                className="w-full h-12 rounded-md font-medium"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                onClick={() => {
                  addToCart(selectedItem)
                  setSelectedItem(null)
                }}
              >
                Add to order - €{selectedItem.base_price.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        tenantId={tenant.id}
        tenantName={tenant.name}
        locationId={locationId || locations[0]?.id || ''}
        tableId={tableId}
        currency={tenant.default_currency}
        onOrderComplete={() => setCart([])}
        onlinePaymentsEnabled={(tenant.settings as { online_payments_enabled?: boolean } | null)?.online_payments_enabled === true}
        dineInEnabled={(tenant.settings as { dine_in_enabled?: boolean } | null)?.dine_in_enabled !== false}
        takeawayEnabled={(tenant.settings as { takeaway_enabled?: boolean } | null)?.takeaway_enabled !== false}
        deliveryEnabled={(tenant.settings as { delivery_enabled?: boolean } | null)?.delivery_enabled === true}
        theme={theme}
      />
    </div>
  )
}
