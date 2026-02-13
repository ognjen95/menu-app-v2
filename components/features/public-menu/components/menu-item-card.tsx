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
      className="animate-fade-in-up rounded-3xl overflow-hidden hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex flex-col h-full"
      style={{ 
        backgroundColor: cardBg, 
        border: `1px solid ${borderColor}`,
        animationDelay: `${itemIndex * 30}ms`
      }}
      onClick={() => onItemClick(item)}
    >
        {/* Image - fixed height */}
        {item.image_urls && item.image_urls.length > 0 ? (
          <div className="h-40 flex-shrink-0 relative" style={{ backgroundColor: theme.secondary }}>
            <Image
              src={item.image_urls[0]}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={60}
              className="object-cover"
              {...(isAboveFold ? { priority: true } : { loading: 'lazy' })}
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
          </div>
        </div>
      </div>
  )
})
