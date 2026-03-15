'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Search, X, ChevronDown, Menu, ShoppingCart } from 'lucide-react'
import { TenantPublicLanguagesSwitcher } from '@/components/language-switcher'

interface Language {
  code: string
  name: string
  nativeName: string
  flagEmoji: string
}

interface Category {
  id: string
  name: string
}

interface Theme {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

interface PublicMenuHeaderProps {
  theme: Theme
  tenant: { name: string; logo_url?: string | null, id: string }
  website?: { logo_url?: string | null; mobile_header_image_url?: string | null } | null
  tableId?: string | null
  languages: Language[]
  currentLanguage: string
  allCategories: Category[]
  selectedCategory: string | null
  cartItemsCount: number
  cartAnimation: string[]
  searchQuery: string
  isSearchOpen: boolean
  onLanguageChange: (code: string) => void
  onCategoryChange: (categoryId: string | null) => void
  onCartOpen: () => void
  onSearchToggle: () => void
  onSearchChange: (query: string) => void
  onInfoOpen: () => void
  getTranslatedText: (id: string, field: 'name' | 'description', fallback: string, type?: 'menu_item' | 'category' | 'variant_category' | 'menu_item_variant') => string
  getContrastColor: (hex: string) => string
  t: (key: string) => string
}

export function PublicMenuHeader({
  theme,
  tenant,
  website,
  tableId,
  languages,
  currentLanguage,
  allCategories,
  selectedCategory,
  cartItemsCount,
  cartAnimation,
  searchQuery,
  isSearchOpen,
  onLanguageChange,
  onCategoryChange,
  onCartOpen,
  onSearchToggle,
  onSearchChange,
  onInfoOpen,
  getTranslatedText,
  getContrastColor,
  t,
}: PublicMenuHeaderProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [isCoverVisible, setIsCoverVisible] = useState(true)
  const spacerRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === currentLanguage)
  const haveLogo = website?.logo_url || tenant.logo_url
  const mobileHeaderImage = website?.mobile_header_image_url

  const borderColor = `${theme.foreground}15`
  const cardBg = `${theme.foreground}05`
  const mutedForeground = `${theme.foreground}99`

  const handleLanguageChange = (code: string) => {
    onLanguageChange(code)
    setLangMenuOpen(false)
  }

  useEffect(() => {
    if (!mobileHeaderImage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCoverVisible(entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )

    if (spacerRef.current) {
      observer.observe(spacerRef.current)
    }

    return () => observer.disconnect()
  }, [mobileHeaderImage])

  const ActionButtons = ({ className = '', floating = false }: { className?: string; floating?: boolean }) => (
    <div className={`flex items-center ${className}`}>
      <button
        className="p-2 rounded-md transition-colors"
        style={{
          backgroundColor: floating ? 'rgba(0,0,0,0.3)' : (isSearchOpen ? cardBg : 'transparent'),
          color: floating ? '#fff' : theme.foreground,
          backdropFilter: floating ? 'blur(8px)' : undefined,
        }}
        onClick={onSearchToggle}
        aria-label={isSearchOpen ? 'Close search' : 'Search'}
      >
        {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
      </button>

      <div style={{ color: floating ? '#fff' : undefined }}>
        <TenantPublicLanguagesSwitcher tenantId={tenant?.id} />
      </div>

      <button
        className={`relative p-2 rounded-md transition-colors ${cartAnimation.length > 0 ? 'animate-cart-shake' : ''}`}
        style={{
          backgroundColor: floating ? 'rgba(0,0,0,0.3)' : 'transparent',
          color: floating ? '#fff' : theme.foreground,
          backdropFilter: floating ? 'blur(8px)' : undefined,
        }}
        onClick={onCartOpen}
        aria-label="Cart"
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

      <button
        className="p-2 rounded-md transition-colors"
        style={{
          backgroundColor: floating ? 'rgba(0,0,0,0.3)' : 'transparent',
          color: floating ? '#fff' : theme.foreground,
          backdropFilter: floating ? 'blur(8px)' : undefined,
        }}
        onClick={onInfoOpen}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  )

  // Cover image height constant - used for both cover and spacer
  const COVER_HEIGHT = 180
  const OVERLAP = 24 // How much the content overlaps the cover

  return (
    <>
      {/* Mobile Cover Image with Parallax - fixed behind content */}
      {mobileHeaderImage && (
        <div 
          className="md:hidden fixed top-0 left-0 right-0 z-0"
          style={{ height: COVER_HEIGHT }}
        >
          <Image
            src={mobileHeaderImage}
            alt={tenant.name}
            fill
            className="object-cover"
            priority
          />
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%)'
            }}
          />
          {/* Floating action buttons on cover */}
          <div className="absolute top-3 right-3 z-10">
            <ActionButtons floating />
          </div>
        </div>
      )}

      {/* Spacer for parallax cover on mobile - observed to detect when header should lose rounded corners */}
      {mobileHeaderImage && (
        <div 
          ref={spacerRef} 
          className="md:hidden" 
          style={{ height: COVER_HEIGHT - OVERLAP }} 
          aria-hidden="true" 
        />
      )}

      {/* Sticky Header - rounded only when cover is still visible */}
      <header
        className={`sticky top-0 z-40 transition-[border-radius] duration-200 ${
          mobileHeaderImage && isCoverVisible ? 'md:rounded-none rounded-t-2xl' : 'shadow shadow-gray-200'
        }`}
        style={{
          backgroundColor: theme.background,
          // borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Name */}
            <div className="flex items-center gap-3">
              {haveLogo && (
                <Image
                  src={website?.logo_url || tenant.logo_url || ''}
                  alt={tenant.name}
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain rounded"
                />
              )}
              <div>
                {!haveLogo && (
                  <h1
                    className="font-bold text-lg"
                    style={{
                      fontFamily: `${theme.fontHeading}, sans-serif`,
                      color: theme.foreground
                    }}
                  >
                    {tenant.name}
                  </h1>
                )}
              </div>
            </div>

            {/* Action buttons - always show, but on mobile only when cover is scrolled off */}
            <div className={mobileHeaderImage && isCoverVisible ? 'hidden md:flex' : 'flex'}>
              <ActionButtons />
            </div>
          </div>

          {/* Search */}
          {isSearchOpen && (
            <div className="mt-4 relative animate-fade-in-up">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: mutedForeground }} />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md"
                style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${borderColor}`,
                  color: theme.foreground,
                }}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div
          className="overflow-x-auto scrollbar-hide"
          // style={{ borderTop: `1px solid ${borderColor}` }}
        >
          <div className="container mx-auto px-4">
            <div className="flex gap-2 pb-2">
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: selectedCategory === null ? theme.primary : 'transparent',
                  color: selectedCategory === null ? getContrastColor(theme.primary) : theme.foreground,
                }}
                onClick={() => onCategoryChange(null)}
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
                  onClick={() => onCategoryChange(category.id)}
                >
                  {getTranslatedText(category.id, 'name', category.name, 'category')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
