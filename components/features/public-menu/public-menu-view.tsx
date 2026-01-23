'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Clock,
  Flame,
  Leaf,
  AlertTriangle,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tenant, Menu, MenuItem, Allergen, Location, Website } from '@/lib/types'
import { CheckoutDialog } from './checkout-dialog'

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

  // Get primary color from website or default
  const primaryColor = website?.primary_color || '#3B82F6'

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
  }

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = item.quantity + delta
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="font-bold text-lg">{tenant.name}</h1>
                {tableId && (
                  <p className="text-sm text-muted-foreground">Table ordering</p>
                )}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="overflow-x-auto scrollbar-hide border-t">
          <div className="container mx-auto px-4">
            <div className="flex gap-2 py-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {allCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
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
            <Badge
              key={filter}
              variant={selectedFilters.includes(filter) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setSelectedFilters(prev =>
                  prev.includes(filter)
                    ? prev.filter(f => f !== filter)
                    : [...prev, filter]
                )
              }}
            >
              {filter === 'vegetarian' && <Leaf className="h-3 w-3 mr-1" />}
              {filter}
            </Badge>
          ))}
        </div>

        {/* Items grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const itemAllergens = item.item_allergens?.map(ia => ia.allergens) || []
              
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image */}
                  {item.image_urls && item.image_urls.length > 0 ? (
                    <div className="aspect-video bg-muted">
                      <img
                        src={item.image_urls[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-primary whitespace-nowrap">
                        €{item.base_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Tags and info */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {item.is_new && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                      {item.dietary_tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {itemAllergens.length > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {itemAllergens.length} allergens
                        </Badge>
                      )}
                    </div>

                    {/* Add to cart button */}
                    <Button
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.variants?.length || item.option_groups?.length) {
                          setSelectedItem(item)
                        } else {
                          addToCart(item)
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to order
                    </Button>
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
          <Button
            className="w-full h-14 text-lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View order ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Cart sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">Your Order</h2>
                <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((cartItem) => {
                      const itemPrice = cartItem.item.base_price + (cartItem.variant?.price_modifier || 0)
                      const optionsPrice = cartItem.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
                      const totalPrice = (itemPrice + optionsPrice) * cartItem.quantity

                      return (
                        <div key={cartItem.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{cartItem.item.name}</h4>
                            {cartItem.variant && (
                              <p className="text-sm text-muted-foreground">{cartItem.variant.name}</p>
                            )}
                            {cartItem.selectedOptions.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                + {cartItem.selectedOptions.map(o => o.name).join(', ')}
                              </p>
                            )}
                            <p className="font-semibold mt-1">€{totalPrice.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(cartItem.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(cartItem.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t p-4 space-y-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full h-12 text-lg"
                    onClick={() => {
                      setCartOpen(false)
                      setCheckoutOpen(true)
                    }}
                  >
                    Place Order
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item detail modal would go here */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-t-xl sm:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                  {selectedItem.description && (
                    <p className="text-muted-foreground mt-1">{selectedItem.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedItem(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-2xl font-bold text-primary mb-6">
                €{selectedItem.base_price.toFixed(2)}
              </div>

              {/* Variants */}
              {selectedItem.variants && selectedItem.variants.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.variants.map((variant) => (
                      <Badge
                        key={variant.id}
                        variant="outline"
                        className="cursor-pointer px-4 py-2"
                      >
                        {variant.name}
                        {variant.price_modifier > 0 && ` (+€${variant.price_modifier.toFixed(2)})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Option groups */}
              {selectedItem.option_groups?.map((group) => (
                <div key={group.id} className="mb-6">
                  <h3 className="font-semibold mb-2">
                    {group.name}
                    {group.is_required && <span className="text-destructive ml-1">*</span>}
                  </h3>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                      >
                        <span>{option.name}</span>
                        <span className="text-muted-foreground">
                          {option.price > 0 && `+€${option.price.toFixed(2)}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                className="w-full h-12"
                onClick={() => {
                  addToCart(selectedItem)
                  setSelectedItem(null)
                }}
              >
                Add to order - €{selectedItem.base_price.toFixed(2)}
              </Button>
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
      />
    </div>
  )
}
