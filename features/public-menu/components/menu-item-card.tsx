'use client'

import { memo } from 'react'
import Image from 'next/image'
import { Plus, Star, Leaf, AlertTriangle } from 'lucide-react'

type MenuItemWithRelations = any // eslint-disable-line

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

interface MenuItemCardProps {
  item: MenuItemWithRelations
  itemIndex: number
  isAboveFold?: boolean // For LCP optimization - first 6 items should be priority
  cartQuantity?: number // How many of this item are in the cart
  theme: Theme
  cardBg: string
  borderColor: string
  mutedForeground: string
  getTranslatedText: (id: string, field: 'name' | 'description', fallback: string, type?: any) => string // eslint-disable-line
  getContrastColor: (hex: string) => string
  tDietary: (tag: string) => string
  tNew: string
  tSale: string
  tAddToOrder: string
  onItemClick: (item: any) => void // eslint-disable-line
  onAddToCart: (item: any) => void // eslint-disable-line
}

export const MenuItemCard = memo(function MenuItemCard({
  item,
  itemIndex,
  isAboveFold = false,
  cartQuantity = 0,
  theme,
  cardBg,
  borderColor,
  mutedForeground,
  getTranslatedText,
  getContrastColor,
  tDietary,
  tNew,
  tSale,
  tAddToOrder,
  onItemClick,
  onAddToCart,
}: MenuItemCardProps) {
  const itemAllergens = item.item_allergens?.map((ia: any) => ia.allergens) || [] // eslint-disable-line

  return (
    <div
      className="animate-fade-in-up rounded-2xl overflow-hidden hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer"
      style={{ 
        backgroundColor: cardBg, 
        // border: `1px solid ${borderColor}`,
        animationDelay: `${itemIndex * 30}ms`
      }}
      onClick={() => onItemClick(item)}
    >
      {/* Mobile: Horizontal layout (image left, content right) */}
      <div className="flex gap-3 p-3 md:hidden">
        {/* Image - compact square on mobile */}
        {item.image_urls && item.image_urls.length > 0 ? (
          <div className="w-20 h-20 flex-shrink-0 relative rounded-xl overflow-hidden" style={{ backgroundColor: theme.secondary }}>
            <Image
              src={item.image_urls[0]}
              alt={item.name}
              fill
              sizes="80px"
              quality={60}
              className="object-cover"
              {...(isAboveFold ? { priority: true } : { loading: 'lazy' })}
            />
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-xl" style={{ backgroundColor: theme.secondary }}>
            <span className="text-2xl">🍽️</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm leading-tight line-clamp-1" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>
                {getTranslatedText(item.id, 'name', item.name)}
              </h3>
              {item.is_featured && (
                <Star className="h-3.5 w-3.5 fill-current flex-shrink-0" style={{ color: theme.accent }} />
              )}
            </div>
            {item.description && (
              <p className="text-xs line-clamp-2 leading-snug" style={{ color: mutedForeground }}>
                {getTranslatedText(item.id, 'description', item.description)}
              </p>
            )}
          </div>

          {/* Bottom row: tags and price/button */}
          <div className="flex items-center justify-between gap-2 mt-1.5">
            {/* Tags */}
            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
              {item.is_new && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>{tNew}</span>
              )}
              {item.compare_price && item.compare_price > item.base_price && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>{tSale}</span>
              )}
              {item.dietary_tags?.slice(0, 1).map((tag: string) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                  <Leaf className="h-2.5 w-2.5" />
                </span>
              ))}
              {itemAllergens.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                  <AlertTriangle className="h-2.5 w-2.5" />
                </span>
              )}
            </div>

            {/* Price and add button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <div className="font-bold text-sm whitespace-nowrap" style={{ color: theme.primary }}>
                  €{item.base_price.toFixed(2)}
                </div>
                {item.compare_price && item.compare_price > item.base_price && (
                  <div className="text-[10px] line-through leading-none" style={{ color: mutedForeground }}>
                    €{item.compare_price.toFixed(2)}
                  </div>
                )}
              </div>
              {cartQuantity > 0 ? (
                <div
                  className="min-w-7 h-7 px-2 rounded-lg flex items-center justify-center font-semibold text-sm"
                  style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                >
                  {cartQuantity}
                </div>
              ) : (
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                  style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (item.variants?.length || item.option_groups?.length) {
                      onItemClick(item)
                    } else {
                      onAddToCart(item)
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Vertical layout (original) */}
      <div className="hidden md:flex md:flex-col h-full">
        {/* Image - fixed height */}
        {item.image_urls && item.image_urls.length > 0 ? (
          <div className="h-40 flex-shrink-0 relative" style={{ backgroundColor: theme.secondary }}>
            <Image
              src={item.image_urls[0]}
              alt={item.name}
              fill
              sizes="(max-width: 1024px) 33vw, 25vw"
              quality={60}
              className="object-cover"
              loading="lazy"
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

          {/* Tags and info */}
          {(item.is_new || (item.compare_price && item.compare_price > item.base_price) || item.dietary_tags?.length || itemAllergens.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-3 max-h-14 overflow-hidden">
              {item.is_new && (
                <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>{tNew}</span>
              )}
              {item.compare_price && item.compare_price > item.base_price && (
                <span className="text-xs px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>{tSale}</span>
              )}
              {item.dietary_tags?.slice(0, 2).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0 max-w-24 truncate" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                  <Leaf className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{tDietary(tag) || tag}</span>
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
            {cartQuantity > 0 ? (
              <div
                className="w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 4px 14px 0 ${theme.primary}40` }}
              >
                <span className="font-bold">{cartQuantity}×</span> {tAddToOrder}
              </div>
            ) : (
              <button
                className="w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] active:shadow-md"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 4px 14px 0 ${theme.primary}40` }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (item.variants?.length || item.option_groups?.length) {
                    onItemClick(item)
                  } else {
                    onAddToCart(item)
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                {tAddToOrder}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
