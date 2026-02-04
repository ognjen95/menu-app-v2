import { useState, useEffect, useMemo, useCallback } from 'react'

export interface MenuItemVariant {
  id: string
  name: string
  price_adjustment: number
  is_default: boolean
  is_available: boolean
  category_id: string
  category?: VariantCategory
}

export interface VariantCategory {
  id: string
  name: string
  description?: string
  is_required: boolean
  allow_multiple: boolean
}

export interface SelectedVariantInfo {
  id: string
  name: string
  price_adjustment: number
}

interface UseVariantSelectionProps {
  variants: MenuItemVariant[] | undefined
  basePrice: number
  itemId?: string
}

interface UseVariantSelectionReturn {
  selectedVariants: Record<string, string[]>
  variantsByCategory: Record<string, MenuItemVariant[]>
  handleVariantClick: (categoryId: string, variantId: string, allowMultiple: boolean) => void
  totalPrice: number
  getSelectedVariantInfos: () => SelectedVariantInfo[]
  resetSelection: () => void
  isValid: () => boolean
}

/**
 * Hook for managing variant selection state and calculations.
 * Used in both public menu and dashboard order creation.
 */
export function useVariantSelection({
  variants,
  basePrice,
  itemId,
}: UseVariantSelectionProps): UseVariantSelectionReturn {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({})

  // Group variants by category
  const variantsByCategory = useMemo((): Record<string, MenuItemVariant[]> => {
    if (!variants?.length) return {}
    return variants.reduce((acc: Record<string, MenuItemVariant[]>, v) => {
      const catId = v.category_id
      if (!acc[catId]) acc[catId] = []
      acc[catId].push(v)
      return acc
    }, {})
  }, [variants])

  // Initialize selected variants with defaults when item changes
  useEffect(() => {
    if (!variants?.length) {
      setSelectedVariants({})
      return
    }

    const categoryKeys = Object.keys(variantsByCategory)
    if (categoryKeys.length === 0) {
      return // Wait for variantsByCategory to be calculated
    }

    const defaults: Record<string, string[]> = {}
    categoryKeys.forEach((categoryId) => {
      const categoryVariants = variantsByCategory[categoryId]
      if (!categoryVariants?.length) return

      const category = categoryVariants[0]?.category
      const defaultVariants = categoryVariants.filter((v) => v.is_default && v.is_available)
      
      if (defaultVariants.length > 0) {
        defaults[categoryId] = category?.allow_multiple
          ? defaultVariants.map((v) => v.id)
          : [defaultVariants[0].id]
      } else if (category?.is_required && categoryVariants.some((v) => v.is_available)) {
        // Auto-select first available if required
        const firstAvailable = categoryVariants.find((v) => v.is_available)
        if (firstAvailable) defaults[categoryId] = [firstAvailable.id]
      }
    })
    setSelectedVariants(defaults)
  }, [itemId, variants, variantsByCategory])

  // Handle variant selection
  const handleVariantClick = useCallback(
    (categoryId: string, variantId: string, allowMultiple: boolean) => {
      setSelectedVariants((prev) => {
        const current = prev[categoryId] || []
        if (allowMultiple) {
          // Toggle for multi-select
          if (current.includes(variantId)) {
            return { ...prev, [categoryId]: current.filter((id) => id !== variantId) }
          } else {
            return { ...prev, [categoryId]: [...current, variantId] }
          }
        } else {
          // Single select - replace
          return { ...prev, [categoryId]: [variantId] }
        }
      })
    },
    []
  )

  // Calculate total price with selected variants
  const totalPrice = useMemo(() => {
    let total = basePrice || 0
    Object.values(selectedVariants)
      .flat()
      .forEach((variantId) => {
        const variant = variants?.find((v) => v.id === variantId)
        if (variant) {
          total += variant.price_adjustment || 0
        }
      })
    return total
  }, [basePrice, variants, selectedVariants])

  // Get selected variant information for cart/order submission
  const getSelectedVariantInfos = useCallback((): SelectedVariantInfo[] => {
    const selectedIds = Object.values(selectedVariants).flat()
    return selectedIds
      .map((variantId) => {
        const variant = variants?.find((v) => v.id === variantId)
        if (!variant) return null
        return {
          id: variant.id,
          name: variant.name,
          price_adjustment: variant.price_adjustment,
        }
      })
      .filter((v): v is SelectedVariantInfo => v !== null)
  }, [selectedVariants, variants])

  // Reset selection to defaults
  const resetSelection = useCallback(() => {
    if (!variants?.length) {
      setSelectedVariants({})
      return
    }

    const categoryKeys = Object.keys(variantsByCategory)
    const defaults: Record<string, string[]> = {}
    
    categoryKeys.forEach((categoryId) => {
      const categoryVariants = variantsByCategory[categoryId]
      if (!categoryVariants?.length) return

      const category = categoryVariants[0]?.category
      const defaultVariants = categoryVariants.filter((v) => v.is_default && v.is_available)
      
      if (defaultVariants.length > 0) {
        defaults[categoryId] = category?.allow_multiple
          ? defaultVariants.map((v) => v.id)
          : [defaultVariants[0].id]
      } else if (category?.is_required && categoryVariants.some((v) => v.is_available)) {
        const firstAvailable = categoryVariants.find((v) => v.is_available)
        if (firstAvailable) defaults[categoryId] = [firstAvailable.id]
      }
    })
    setSelectedVariants(defaults)
  }, [variants, variantsByCategory])

  // Validate that all required categories have selections
  const isValid = useCallback((): boolean => {
    const categoryKeys = Object.keys(variantsByCategory)
    return categoryKeys.every((categoryId) => {
      const categoryVariants = variantsByCategory[categoryId]
      const category = categoryVariants[0]?.category
      if (!category?.is_required) return true
      const selected = selectedVariants[categoryId] || []
      return selected.length > 0
    })
  }, [variantsByCategory, selectedVariants])

  return {
    selectedVariants,
    variantsByCategory,
    handleVariantClick,
    totalPrice,
    getSelectedVariantInfos,
    resetSelection,
    isValid,
  }
}
