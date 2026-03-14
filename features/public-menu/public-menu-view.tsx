'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Plus,
  Leaf,
  ShoppingCart,
} from 'lucide-react'
import type { Tenant, Menu, MenuItem, Allergen, Location, Website, Translation } from '@/lib/types'
import dynamic from 'next/dynamic'
// Removed Framer Motion for better performance
import { CategorySection } from './components/category-section'
import { PublicMenuHeader } from './public-menu-header'
import { DIETARY_TAG_OPTIONS } from '@/lib/constants/menu-items'
import { CookieLocale } from '@/i18n/config'

// Lazy load modals - not needed on initial render
const CartSidebar = dynamic(() => import('./components/cart-sidebar').then(mod => mod.CartSidebar), { ssr: false })
const ItemDetailModal = dynamic(() => import('./item-detail-modal').then(mod => mod.ItemDetailModal), { ssr: false })
const CheckoutDialog = dynamic(() => import('./checkout-dialog').then(mod => mod.CheckoutDialog), { ssr: false })
const InfoSidebar = dynamic(() => import('./components/info-sidebar').then(mod => mod.InfoSidebar), { ssr: false })

// Language type for public menu
type PublicLanguage = {
  code: string
  isDefault: boolean
  name: string
  nativeName: string
  flagEmoji: string
}

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

type MenuItemVariantWithCategory = {
  id: string
  name: string
  price_adjustment: number
  is_default: boolean
  is_available: boolean
  category_id: string
  category?: {
    id: string
    name: string
    description?: string
    is_required: boolean
    allow_multiple: boolean
  }
}

type MenuItemWithRelations = MenuItem & {
  variants?: { id: string; name: string; price_modifier: number; is_default: boolean }[]
  menu_item_variants?: MenuItemVariantWithCategory[]
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

type SelectedVariantInfo = {
  id: string
  name: string
  price_adjustment: number
}

type CartItem = {
  id: string
  item: MenuItemWithRelations
  variant?: { id: string; name: string; price_modifier: number }
  selectedVariants?: Record<string, string[]> // categoryId -> variantIds
  selectedVariantInfos?: SelectedVariantInfo[] // Flattened variant details for order submission
  calculatedPrice?: number // Price with all variant adjustments
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
  languages?: PublicLanguage[]
  translations?: Translation[]
  initialLanguage?: string
  slug?: string
}

export function PublicMenuView({
  tenant,
  menus,
  locations,
  allergens,
  website,
  tableId,
  locationId,
  languages = [],
  translations = [],
  initialLanguage = 'en',
  slug,
}: PublicMenuViewProps) {
  const t = useTranslations('publicMenuView')
  const tDietary = useTranslations('dietaryTags')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRelations | null>(null)
  const [cartAnimation, setCartAnimation] = useState<string[]>([])
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)

  // Sync language from URL on mount and when searchParams change
  // useEffect(() => {
  //   const langFromUrl = searchParams.get('lang')
  //   if (langFromUrl && languages.some(l => l.code === langFromUrl)) {
  //     setCurrentLanguage(langFromUrl)
  //   }
  // }, [searchParams, languages])

  // Lock body scroll when cart or checkout is open
  useEffect(() => {
    if (cartOpen || checkoutOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen, checkoutOpen])

  // Get translated text for items, categories, variant categories, or variants
  // Always look for translation first, fallback to DB value if not found
  const getTranslatedText = useCallback((
    id: string,
    field: 'name' | 'description',
    fallback: string,
    type: 'menu_item' | 'category' | 'variant_category' | 'menu_item_variant' = 'menu_item'
  ) => {
    const key = `${type}.${id}.${field}`
    const translation = translations.find(t => t.key === key && t.language_code === currentLanguage)
    return translation?.value || fallback
  }, [currentLanguage, translations])

  // Handle language change - set PUBLIC_LOCALE cookie and refresh to load new translations
  const handleLanguageChange = useCallback((langCode: string) => {
    setCurrentLanguage(langCode) // Immediate state update for menu content translations

    // Set PUBLIC_LOCALE cookie (expires in 1 year)
    document.cookie = `${CookieLocale.PUBLIC}=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    // Update URL param and refresh to load new UI translations from server
    const params = new URLSearchParams(searchParams.toString())
    params.set('lang', langCode)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    router.refresh() // Trigger server re-render to load new translations
  }, [router, pathname, searchParams])

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0]

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

  // const allItems = useMemo(() => {
  //   return allCategories.flatMap(cat =>
  //     cat.items.filter(item => item.is_active && !item.is_sold_out)
  //   )
  // }, [allCategories])

  // Filter items and group by category
  const filteredCategories = useMemo(() => {
    const categoriesToShow = selectedCategory
      ? allCategories.filter(c => c.id === selectedCategory)
      : allCategories

    return categoriesToShow
      .map(category => {
        let items = category.items.filter(item => item.is_active && !item.is_sold_out)

        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          items = items.filter(item => {
            // Search in original values
            const matchesOriginal =
              item.name.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query)

            // Search in translated values
            const translatedName = translations.find(
              t => t.key === `menu_item.${item.id}.name` && t.language_code === currentLanguage
            )?.value?.toLowerCase()
            const translatedDesc = translations.find(
              t => t.key === `menu_item.${item.id}.description` && t.language_code === currentLanguage
            )?.value?.toLowerCase()

            const matchesTranslation =
              translatedName?.includes(query) ||
              translatedDesc?.includes(query)

            return matchesOriginal || matchesTranslation
          })
        }

        if (selectedFilters.length > 0) {
          items = items.filter(item =>
            selectedFilters.every(filter => item.dietary_tags?.includes(filter))
          )
        }

        return { ...category, items }
      })
      .filter(category => category.items.length > 0)
  }, [allCategories, selectedCategory, searchQuery, selectedFilters, translations, currentLanguage])

  // Total filtered items count for empty state
  const totalFilteredItems = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0)

  // Cart functions
  const addToCart = useCallback((itemData: any) => {
    // Handle both old format (item, variant, options) and new format (item with selectedVariants)
    const item = itemData as MenuItemWithRelations & { 
      selectedVariants?: Record<string, string[]>
      selectedVariantInfos?: SelectedVariantInfo[]
      calculatedPrice?: number 
    }
    const selectedVariants = item.selectedVariants || {}
    const selectedVariantInfos = item.selectedVariantInfos || []
    const calculatedPrice = item.calculatedPrice || item.base_price
    
    // Create unique ID based on item and selected variants
    const variantIds = Object.values(selectedVariants).flat().sort().join('-')
    const cartItemId = `${item.id}-${variantIds || 'default'}`
    
    const cartItem: CartItem = {
      id: cartItemId,
      item,
      selectedVariants,
      selectedVariantInfos,
      calculatedPrice,
      selectedOptions: [],
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
    const animationId = String(Date.now())
    setCartAnimation(prev => [...prev, animationId])
    setTimeout(() => {
      setCartAnimation(prev => prev.filter(id => id !== animationId))
    }, 800)
  }, [])

  const updateCartQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = item.quantity + delta
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }, [])

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId))
  }, [])

  // Memoized callbacks for modals
  const handleCloseCart = useCallback(() => setCartOpen(false), [])
  const handleCloseItemDetail = useCallback(() => setSelectedItem(null), [])
  const handleCloseCheckout = useCallback(() => setCheckoutOpen(false), [])
  const handleCheckout = useCallback(() => {
    setCartOpen(false)
    setCheckoutOpen(true)
  }, [])
  const handleOrderComplete = useCallback(() => setCart([]), [])

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      // Use calculatedPrice if available (new variant system), otherwise fall back to base_price + variant
      const itemPrice = item.calculatedPrice ?? (item.item.base_price + (item.variant?.price_modifier || 0))
      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
      return total + (itemPrice + optionsPrice) * item.quantity
    }, 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const getCartQuantity = useCallback((itemId: string) => {
    return cart
      .filter(cartItem => cartItem.item.id === itemId)
      .reduce((total, cartItem) => total + cartItem.quantity, 0)
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
      <PublicMenuHeader
        theme={theme}
        tenant={tenant}
        website={website}
        tableId={tableId}
        languages={languages}
        currentLanguage={currentLanguage}
        allCategories={allCategories}
        selectedCategory={selectedCategory}
        cartItemsCount={cartItemsCount}
        cartAnimation={cartAnimation}
        searchQuery={searchQuery}
        isSearchOpen={isSearchOpen}
        onLanguageChange={handleLanguageChange}
        onCategoryChange={setSelectedCategory}
        onCartOpen={() => setCartOpen(true)}
        onSearchToggle={() => {
          setIsSearchOpen(!isSearchOpen)
          if (isSearchOpen) setSearchQuery('')
        }}
        onSearchChange={setSearchQuery}
        onInfoOpen={() => setInfoOpen(true)}
        getTranslatedText={getTranslatedText}
        getContrastColor={getContrastColor}
        t={t}
      />

      {/* Menu items */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Dietary filters */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up">
          {DIETARY_TAG_OPTIONS.map((filter) => (
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
              {tDietary(filter)}
            </button>
          ))}
        </div>

        {/* Items grouped by category */}
        {totalFilteredItems === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: mutedForeground }}>{t('noItemsFound')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category, categoryIndex) => (
              <CategorySection
                key={category.id}
                category={category}
                categoryIndex={categoryIndex}
                theme={theme}
                cardBg={cardBg}
                borderColor={borderColor}
                mutedForeground={mutedForeground}
                getTranslatedText={getTranslatedText}
                getContrastColor={getContrastColor}
                tDietary={(tag) => tDietary(tag as any) || tag}
                tNew={t('new')}
                tSale={t('sale')}
                tAddToOrder={t('addToOrder')}
                getCartQuantity={getCartQuantity}
                onItemClick={setSelectedItem}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart floating button (mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden p-4 backdrop-blur-md" style={{ backgroundColor: `${theme.background}80` }}>
          <button
            className="w-full h-14 text-lg rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 8px 24px 0 ${theme.primary}50` }}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {t('viewOrder')} ({cartItemsCount}) - €{cartTotal.toFixed(2)}
          </button>
        </div>
      )}

      {/* Cart sidebar */}
      <CartSidebar
        isOpen={cartOpen}
        cart={cart}
        cartTotal={cartTotal}
        theme={theme}
        cardBg={cardBg}
        borderColor={borderColor}
        mutedForeground={mutedForeground}
        tableId={tableId}
        tYourOrder={t('yourOrder')}
        tCartEmpty={t('cartEmpty')}
        tTotal={t('total')}
        tPlaceOrder={t('placeOrder')}
        tHistory={t('history')}
        tNoHistory={t('noHistory')}
        tOrderStatus={{
          draft: t('orderStatus.draft'),
          placed: t('orderStatus.placed'),
          accepted: t('orderStatus.accepted'),
          preparing: t('orderStatus.preparing'),
          ready: t('orderStatus.ready'),
          served: t('orderStatus.served'),
        }}
        getTranslatedText={getTranslatedText}
        getContrastColor={getContrastColor}
        onClose={handleCloseCart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />

      {/* Item detail modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={handleCloseItemDetail}
        onAddToCart={addToCart}
        theme={theme}
        getTranslatedText={getTranslatedText}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        isOpen={checkoutOpen}
        onClose={handleCloseCheckout}
        cart={cart}
        cartTotal={cartTotal}
        tenantId={tenant.id}
        tenantName={tenant.name}
        locationId={locationId || locations[0]?.id || ''}
        tableId={tableId}
        currency={tenant.default_currency}
        onOrderComplete={handleOrderComplete}
        onlinePaymentsEnabled={(tenant.settings as { online_payments_enabled?: boolean } | null)?.online_payments_enabled === true}
        dineInEnabled={(tenant.settings as { dine_in_enabled?: boolean } | null)?.dine_in_enabled !== false}
        takeawayEnabled={(tenant.settings as { takeaway_enabled?: boolean } | null)?.takeaway_enabled !== false}
        deliveryEnabled={(tenant.settings as { delivery_enabled?: boolean } | null)?.delivery_enabled === true}
        theme={theme}
      />

      {/* Info Sidebar */}
      <InfoSidebar
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        onCartOpen={() => setCartOpen(true)}
        cartItemsCount={cartItemsCount}
        tenant={tenant}
        location={locations.find(l => l.id === locationId) || locations[0]}
        website={website}
        theme={theme}
      />
    </div>
  )
}
