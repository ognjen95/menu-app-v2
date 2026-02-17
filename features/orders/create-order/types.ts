import type { Control } from 'react-hook-form'
import type { Location, Table, MenuItem } from '@/lib/types'
import type { SelectedVariantInfo, MenuItemVariant } from '@/lib/hooks/use-variant-selection'

export type MenuItemWithVariants = MenuItem & {
  category?: { id: string; name: string }
  menu_item_variants?: MenuItemVariant[]
}

export type CartItem = {
  id: string
  menuItem: MenuItemWithVariants
  quantity: number
  notes?: string
  selectedVariants?: SelectedVariantInfo[]
  calculatedPrice: number
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery'

export type CustomerInfoValues = {
  name: string
  phone: string
  notes: string
}

export type TeamMember = {
  id: string
  user_id: string
  role: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  }
}

export type Category = {
  id: string
  name: string
}

// Component Props Types
export type MenuItemCardProps = {
  item: MenuItemWithVariants
  quantity: number
  isHighlighted: boolean
  onItemClick: (item: MenuItemWithVariants) => void
  t: (key: string) => string
}

export type MenuItemsGridProps = {
  items: MenuItemWithVariants[]
  itemQuantities: Record<string, number>
  recentlyAddedId: string | null
  isLoading: boolean
  onItemClick: (item: MenuItemWithVariants) => void
  t: (key: string) => string
}

export type CartItemRowProps = {
  item: CartItem
  onUpdateQuantity: (cartItemId: string, delta: number) => void
  onRemove: (cartItemId: string) => void
}

export type CartSidebarProps = {
  cart: CartItem[]
  cartTotal: number
  cartItemsCount: number
  isSubmitting: boolean
  customerInfoControl: Control<CustomerInfoValues>
  isCustomerInfoOpen: boolean
  onCustomerInfoToggle: (open: boolean) => void
  onUpdateQuantity: (cartItemId: string, delta: number) => void
  onRemoveItem: (cartItemId: string) => void
  onClearCart: () => void
  onSubmit: () => void
  onClose?: () => void
  className?: string
  t: (key: string) => string
}

export type OrderTypeSelectorProps = {
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
  t: (key: string) => string
}

export type CategoryFilterProps = {
  categories: Category[]
  selectedCategoryId: string | null
  isLoading: boolean
  onCategorySelect: (categoryId: string | null) => void
  t: (key: string) => string
}

export type OrderSetupFormProps = {
  locations: Location[]
  tables: Table[]
  teamMembers: TeamMember[]
  selectedLocationId: string
  selectedTableId: string
  selectedStaffId: string
  orderType: OrderType
  onLocationChange: (locationId: string) => void
  onTableChange: (tableId: string) => void
  onStaffChange: (staffId: string) => void
  onOrderTypeChange: (type: OrderType) => void
  t: (key: string) => string
}

export type VariantSelectionDialogProps = {
  item: MenuItemWithVariants | null
  onClose: () => void
  onAddToCart: (item: MenuItemWithVariants, variants: SelectedVariantInfo[], price: number) => void
  t: (key: string) => string
  tCommon: (key: string) => string
}
