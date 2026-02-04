'use client'

import { cn } from '@/lib/utils'
import type { MenuItemVariant } from '@/lib/hooks/use-variant-selection'

interface VariantSelectorProps {
  variantsByCategory: Record<string, MenuItemVariant[]>
  selectedVariants: Record<string, string[]>
  onVariantClick: (categoryId: string, variantId: string, allowMultiple: boolean) => void
  translations?: {
    selectMultiple?: string
    required?: string
  }
  theme?: {
    foreground?: string
    primary?: string
    borderColor?: string
    mutedForeground?: string
    cardBg?: string
  }
  className?: string
}

/**
 * Reusable variant selector component for displaying and selecting menu item variants.
 * Works with both themed (public menu) and default (dashboard) styling.
 */
export function VariantSelector({
  variantsByCategory,
  selectedVariants,
  onVariantClick,
  translations = {},
  theme,
  className,
}: VariantSelectorProps) {
  const {
    selectMultiple = 'Select multiple',
    required = '*',
  } = translations

  // Default theme for dashboard (uses CSS variables)
  const defaultTheme = {
    foreground: undefined,
    primary: 'hsl(var(--primary))',
    borderColor: 'hsl(var(--border))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    cardBg: 'hsl(var(--muted))',
  }

  const appliedTheme = theme || defaultTheme
  const isCustomTheme = !!theme

  if (Object.keys(variantsByCategory).length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(variantsByCategory).map(([categoryId, variants]) => {
        const category = variants[0]?.category
        if (!category) return null
        const selected = selectedVariants[categoryId] || []

        return (
          <div key={categoryId}>
            <h4 
              className={cn(
                "font-medium text-sm mb-2 flex items-center gap-2",
                !isCustomTheme && "text-foreground"
              )}
              style={isCustomTheme ? { color: appliedTheme.foreground } : undefined}
            >
              {category.name}
              {category.is_required && (
                <span className="text-destructive">{required}</span>
              )}
              {category.allow_multiple && (
                <span 
                  className={cn("text-xs font-normal", !isCustomTheme && "text-muted-foreground")}
                  style={isCustomTheme ? { color: appliedTheme.mutedForeground } : undefined}
                >
                  ({selectMultiple})
                </span>
              )}
            </h4>
            {category.description && (
              <p 
                className={cn("text-xs mb-2", !isCustomTheme && "text-muted-foreground")}
                style={isCustomTheme ? { color: appliedTheme.mutedForeground } : undefined}
              >
                {category.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {variants
                .filter((v) => v.is_available)
                .map((variant) => {
                  const isSelected = selected.includes(variant.id)
                  
                  if (isCustomTheme) {
                    // Custom theme styling (for public menu)
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        className="cursor-pointer px-3 py-1.5 rounded-md transition-all text-sm hover:scale-105"
                        style={{
                          border: isSelected
                            ? `2px solid ${appliedTheme.primary}`
                            : `1px solid ${appliedTheme.borderColor}`,
                          color: appliedTheme.foreground,
                          backgroundColor: isSelected ? `${appliedTheme.primary}15` : 'transparent',
                        }}
                        onClick={() => onVariantClick(categoryId, variant.id, category.allow_multiple)}
                      >
                        {variant.name}
                        {variant.price_adjustment !== 0 && (
                          <span style={{ color: appliedTheme.mutedForeground, marginLeft: '4px' }}>
                            {variant.price_adjustment > 0 ? '+' : ''}€{variant.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </button>
                    )
                  }
                  
                  // Default styling (for dashboard)
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-md transition-all text-sm",
                        "border hover:border-primary",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-background"
                      )}
                      onClick={() => onVariantClick(categoryId, variant.id, category.allow_multiple)}
                    >
                      {variant.name}
                      {variant.price_adjustment !== 0 && (
                        <span className="text-muted-foreground ml-1">
                          {variant.price_adjustment > 0 ? '+' : ''}€{variant.price_adjustment.toFixed(2)}
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
