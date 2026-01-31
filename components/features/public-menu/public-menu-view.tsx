'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Leaf,
  AlertTriangle,
  Star,
  Trash2,
  Globe,
  ChevronDown,
} from 'lucide-react'
import type { Tenant, Menu, MenuItem, Allergen, Location, Website, Translation } from '@/lib/types'
import { CheckoutDialog } from './checkout-dialog'
import { ItemDetailModal } from './item-detail-modal'
import Image from 'next/image'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'

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
  const [cartAnimation, setCartAnimation] = useState<number[]>([])
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)

  // Sync language from URL on mount and when searchParams change
  useEffect(() => {
    const langFromUrl = searchParams.get('lang')
    if (langFromUrl && languages.some(l => l.code === langFromUrl)) {
      setCurrentLanguage(langFromUrl)
    }
  }, [searchParams, languages])

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

  // Get translated text for items or categories
  // Always look for translation first, fallback to DB value if not found
  const getTranslatedText = useCallback((
    id: string,
    field: 'name' | 'description',
    fallback: string,
    type: 'menu_item' | 'category' = 'menu_item'
  ) => {
    const key = `${type}.${id}.${field}`
    const translation = translations.find(t => t.key === key && t.language_code === currentLanguage)
    return translation?.value || fallback
  }, [currentLanguage, translations])

  // Handle language change - set PUBLIC_LOCALE cookie and refresh to load new translations
  const handleLanguageChange = useCallback((langCode: string) => {
    setCurrentLanguage(langCode) // Immediate state update for menu content translations
    setLangMenuOpen(false)
    
    // Set PUBLIC_LOCALE cookie (expires in 1 year)
    document.cookie = `PUBLIC_LOCALE=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    
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

  const allItems = useMemo(() => {
    return allCategories.flatMap(cat =>
      cat.items.filter(item => item.is_active && !item.is_sold_out)
    )
  }, [allCategories])

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
      <motion.header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: theme.background,
          borderBottom: `1px solid ${borderColor}`,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
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

            <div className="flex items-center gap-2">
              {/* Language selector */}
              {languages.length > 1 && (
                <div className="relative">
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium"
                    style={{
                      border: `1px solid ${borderColor}`,
                      backgroundColor: 'transparent',
                      color: theme.foreground,
                    }}
                    onClick={() => setLangMenuOpen(!langMenuOpen)}
                  >
                    <span className="text-base">{currentLang?.flagEmoji}</span>
                    <span className="hidden sm:inline">{currentLang?.nativeName}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Language dropdown */}
                  {langMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setLangMenuOpen(false)}
                      />
                      {/* Dropdown menu */}
                      <div
                        className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded-md shadow-lg"
                        style={{
                          backgroundColor: theme.background,
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                            style={{
                              backgroundColor: lang.code === currentLanguage ? cardBg : 'transparent',
                              color: theme.foreground,
                            }}
                            onClick={() => handleLanguageChange(lang.code)}
                          >
                            <span>{lang.flagEmoji}</span>
                            <span>{lang.nativeName}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Cart button */}
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
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedForeground }} />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
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
        <motion.div 
          className="overflow-x-auto scrollbar-hide" 
          style={{ borderTop: `1px solid ${borderColor}` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
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
                {t('all')}
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
                  {getTranslatedText(category.id, 'name', category.name, 'category')}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Menu items */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Dietary filters */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {(['vegetarian', 'vegan', 'gluten-free', 'halal'] as const).map((filter) => (
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
        </motion.div>

        {/* Items grouped by category */}
        {totalFilteredItems === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: mutedForeground }}>{t('noItemsFound')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.section 
                key={category.id} 
                id={`category-${category.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + categoryIndex * 0.1 }}
              >
                {/* Category header */}
                <div className="mb-4">
                  <h2 
                    className="text-2xl font-bold" 
                    style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}
                  >
                    {getTranslatedText(category.id, 'name', category.name, 'category')}
                  </h2>
                  {category.description && (
                    <p className="text-sm mt-1" style={{ color: mutedForeground }}>
                      {getTranslatedText(category.id, 'description', category.description, 'category')}
                    </p>
                  )}
                </div>

                {/* Items grid */}
                <motion.div 
                  className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  initial="initial"
                  animate="animate"
                  variants={staggerContainer}
                >
                  {category.items.map((item, itemIndex) => {
                    const itemAllergens = item.item_allergens?.map((ia: { allergens: Allergen }) => ia.allergens) || []

                    return (
                      <motion.div
                        key={item.id}
                        variants={staggerItemScale}
                        custom={itemIndex}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className="rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
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
                                <h3 className="font-semibold truncate" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>
                                  {getTranslatedText(item.id, 'name', item.name)}
                                </h3>
                                {item.is_featured && (
                                  <Star className="h-4 w-4 fill-current" style={{ color: theme.accent }} />
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm line-clamp-2 mt-1" style={{ color: mutedForeground }}>
                                  {getTranslatedText(item.id, 'description', item.description)}
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
                                <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>{t('new')}</span>
                              )}
                              {item.compare_price && item.compare_price > item.base_price && (
                                <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>{t('sale')}</span>
                              )}
                              {item.dietary_tags?.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="text-xs px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 max-w-24 truncate" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                                  <Leaf className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{tDietary(tag as any) || tag}</span>
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
                              className="w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] active:shadow-md"
                              style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 4px 14px 0 ${theme.primary}40` }}
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
                              {t('addToOrder')}
                            </button>
                          </div>
                        </div>
                      </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.section>
            ))}
          </div>
        )}
      </main>

      {/* Cart floating button (mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
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
      {cartOpen && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: `${theme.background}cc` }}>
          <div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md shadow-xl"
            style={{ backgroundColor: theme.background, borderLeft: `1px solid ${borderColor}` }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{t('yourOrder')}</h2>
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
                    <p style={{ color: mutedForeground }}>{t('cartEmpty')}</p>
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
                    <span>{t('total')}</span>
                    <span>€{cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="w-full h-12 text-lg rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                    style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 6px 20px 0 ${theme.primary}50` }}
                    onClick={() => {
                      setCartOpen(false)
                      setCheckoutOpen(true)
                    }}
                  >
                    {t('placeOrder')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item detail modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addToCart}
        theme={theme}
        getTranslatedText={getTranslatedText}
      />

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
