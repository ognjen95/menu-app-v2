'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, X, ChevronDown, Menu } from 'lucide-react'

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
  tenant: { name: string; logo_url?: string | null }
  website?: { logo_url?: string | null } | null
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

  const currentLang = languages.find(l => l.code === currentLanguage)
  const haveLogo = website?.logo_url || tenant.logo_url

  const borderColor = `${theme.foreground}15`
  const cardBg = `${theme.foreground}05`
  const mutedForeground = `${theme.foreground}99`

  const handleLanguageChange = (code: string) => {
    onLanguageChange(code)
    setLangMenuOpen(false)
  }

  return (
    <header
      className="sticky top-0 z-40 animate-fade-in-up"
      style={{
        backgroundColor: theme.background,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {haveLogo && (
              <Image
                src={website?.logo_url || tenant.logo_url || ''}
                alt={tenant.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
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
              {/* {tableId && (
                <p className="text-sm" style={{ color: mutedForeground }}>
                  Table ordering
                </p>
              )} */}
            </div>
          </div>

          <div className="flex items-center">
            {/* Search button */}
            <button
              className="p-2 rounded-md transition-colors"
              style={{
                // border: `1px solid ${borderColor}`,
                backgroundColor: isSearchOpen ? cardBg : 'transparent',
                color: theme.foreground,
              }}
              onClick={onSearchToggle}
              aria-label={isSearchOpen ? 'Close search' : 'Search'}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}            </button>

            {/* Language selector */}
            {languages.length > 1 && (
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium"
                  style={{
                    // border: `1px solid ${borderColor}`,
                    backgroundColor: 'transparent',
                    color: theme.foreground,
                  }}
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                >
                  <span className="text-base">{currentLang?.flagEmoji}</span>
                  <span className="hidden md:inline">{currentLang?.nativeName}</span>
                  <ChevronDown className="h-3.5 w-3.5 hidden md:block" />
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
                        // border: `1px solid ${borderColor}`,
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

            {/* Menu/Cart button */}
            <button
              className={`relative p-2 rounded-md transition-colors ${cartAnimation.length > 0 ? 'animate-cart-shake' : ''}`}
              style={{
                backgroundColor: 'transparent',
                color: theme.foreground,
              }}
              onClick={onInfoOpen}
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
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
        style={{ borderTop: `1px solid ${borderColor}` }}
      >
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-2">
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
  )
}
