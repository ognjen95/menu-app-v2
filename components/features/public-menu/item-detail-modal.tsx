'use client'

import { useTranslations } from 'next-intl'
import { useMediaQuery } from '@/hooks/use-media-query'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  X,
  Leaf,
  AlertTriangle,
  Star,
  Clock,
  Flame,
} from 'lucide-react'
import Image from 'next/image'

// Theme type for styling
export type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

// Using 'any' for item to avoid type duplication with parent component
// The component expects properties: id, name, description, base_price, compare_price, 
// image_urls, is_featured, is_new, preparation_time, calories, dietary_tags,
// variants, option_groups, item_allergens
export interface ItemDetailModalProps {
  item: any // eslint-disable-line
  isOpen: boolean
  onClose: () => void
  onAddToCart: (item: any) => void // eslint-disable-line
  theme: Theme
  getTranslatedText: (id: string, field: 'name' | 'description', fallback: string) => string
}

// Helper function for contrast color
const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#18181B' : '#FFFFFF'
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  theme,
  getTranslatedText,
}: ItemDetailModalProps) {
  const t = useTranslations('publicMenuView')
  const tDietary = useTranslations('dietaryTags')
  const tAllergens = useTranslations('allergens')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (!item) return null

  // Computed colors
  const borderColor = `${theme.foreground}15`
  const cardBg = `${theme.foreground}05`
  const mutedForeground = `${theme.foreground}80`

  const content = (
    <div className="flex flex-col max-h-[85vh] md:max-h-[90vh]">
      {/* Item image */}
      {item.image_urls && item.image_urls.length > 0 && (
        <div className="aspect-video relative flex-shrink-0">
          <Image
            src={item.image_urls[0]}
            alt={item.name}
            className="w-full h-full object-cover md:rounded-t-lg"
            fill
          />
        </div>
      )}

      <div className="p-6 overflow-y-auto flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>
                {getTranslatedText(item.id, 'name', item.name)}
              </h2>
              {item.is_featured && (
                <Star className="h-5 w-5 fill-current" style={{ color: theme.accent }} />
              )}
            </div>
            {item.description && (
              <p className="mt-1" style={{ color: mutedForeground }}>
                {getTranslatedText(item.id, 'description', item.description)}
              </p>
            )}
          </div>
          {/* <button
            className="p-2 rounded-md md:hidden"
            style={{ color: theme.foreground }}
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button> */}
        </div>

        {/* Price section */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold" style={{ color: theme.primary }}>
            €{item.base_price.toFixed(2)}
          </span>
          {item.compare_price && item.compare_price > item.base_price && (
            <span className="text-lg line-through" style={{ color: mutedForeground }}>
              €{item.compare_price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.is_new && (
            <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}>{t('new')}</span>
          )}
          {item.compare_price && item.compare_price > item.base_price && (
            <span className="text-xs px-2 py-1 rounded font-medium" style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}>
              {t('save')} €{(item.compare_price - item.base_price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Info row: prep time, calories */}
        {(item.preparation_time || item.calories) && (
          <div className="flex flex-wrap gap-4 mb-4 py-3 px-4 rounded-lg" style={{ backgroundColor: cardBg }}>
            {item.preparation_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" style={{ color: mutedForeground }} />
                <span className="text-sm" style={{ color: theme.foreground }}>{item.preparation_time} {t('min')}</span>
              </div>
            )}
            {item.calories && (
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: mutedForeground }} />
                <span className="text-sm" style={{ color: theme.foreground }}>{item.calories} {t('kcal')}</span>
              </div>
            )}
          </div>
        )}

        {/* Dietary tags */}
        {item.dietary_tags && item.dietary_tags.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm" style={{ color: theme.foreground }}>{t('dietary')}</h3>
            <div className="flex flex-wrap gap-2">
              {item.dietary_tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}>
                  <Leaf className="h-3 w-3" />
                  {tDietary(tag as any) || tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {item.item_allergens && item.item_allergens.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-1" style={{ color: theme.foreground }}>
              <AlertTriangle className="h-4 w-4" style={{ color: theme.accent }} />
              {t('allergens')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {item.item_allergens.map((ia: { allergen_id: string; allergens: { code: string; name: string } }) => (
                <span key={ia.allergen_id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: cardBg, color: theme.foreground }}>
                  {tAllergens(ia.allergens.code as any) || ia.allergens.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Variants */}
        {item.variants && item.variants.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>{t('size')}</h3>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((variant: { id: string; name: string; price_modifier: number }) => (
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
        {item.option_groups?.map((group: { id: string; name: string; is_required: boolean; options: { id: string; name: string; price: number }[] }) => (
          <div key={group.id} className="mb-6">
            <h3 className="font-semibold mb-2" style={{ color: theme.foreground }}>
              {group.name}
              {group.is_required && <span style={{ color: '#EF4444' }} className="ml-1">*</span>}
            </h3>
            <div className="space-y-2">
              {group.options.map((option: { id: string; name: string; price: number }) => (
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
      </div>

      {/* Fixed add to cart button */}
      <div className="p-4 border-t flex-shrink-0" style={{ borderColor, backgroundColor: theme.background }}>
        <button
          className="w-full h-12 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 6px 20px 0 ${theme.primary}50` }}
          onClick={() => {
            onAddToCart(item)
            onClose()
          }}
        >
          {t('addToOrder')} - €{item.base_price.toFixed(2)}
        </button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-w-lg p-0 gap-0 overflow-hidden"
          style={{ backgroundColor: theme.background, borderColor }}
        >
          <DialogTitle className="sr-only">
            {getTranslatedText(item.id, 'name', item.name)}
          </DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent 
        className="max-h-[95vh] rounded-t-xl overflow-hidden"
        style={{ backgroundColor: theme.background }}
        hideHandle
      >
        <DrawerTitle className="sr-only">
          {getTranslatedText(item.id, 'name', item.name)}
        </DrawerTitle>
        {content}
      </DrawerContent>
    </Drawer>
  )
}
