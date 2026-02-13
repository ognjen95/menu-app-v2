'use client'

import { memo } from 'react'
import { MenuItemCard } from './menu-item-card'

type MenuItemWithRelations = any // eslint-disable-line

type CategoryWithItems = {
  id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  items: MenuItemWithRelations[]
}

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

interface CategorySectionProps {
  category: CategoryWithItems
  categoryIndex: number
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

export const CategorySection = memo(function CategorySection({
  category,
  categoryIndex,
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
}: CategorySectionProps) {
  return (
    <section
      id={`category-${category.id}`}
      className="animate-fade-in-up"
      style={{ animationDelay: `${categoryIndex * 50}ms` }}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {category.items.map((item, itemIndex) => (
          <MenuItemCard
            key={item.id}
            item={item}
            itemIndex={itemIndex}
            isAboveFold={categoryIndex === 0 && itemIndex < 6}
            theme={theme}
            cardBg={cardBg}
            borderColor={borderColor}
            mutedForeground={mutedForeground}
            getTranslatedText={getTranslatedText}
            getContrastColor={getContrastColor}
            tDietary={tDietary}
            tNew={tNew}
            tSale={tSale}
            tAddToOrder={tAddToOrder}
            onItemClick={onItemClick}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  )
})
