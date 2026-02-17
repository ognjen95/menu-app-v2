// Main container export (this is what you import to use the feature)
export { CreateOrderContainer as CreateOrderDialog } from './containers/create-order-container'

// Types export
export type {
  CartItem,
  OrderType,
  CustomerInfoValues,
  MenuItemWithVariants,
  TeamMember,
  Category,
} from './types'

// Hook export (if needed externally)
export { useCreateOrderState } from './hooks/use-create-order-state'
export { getItemQuantities } from './hooks/use-create-order-state'

// Component exports (for composition/testing)
export { MenuItemCard } from './components/menu-item-card'
export { MenuItemsGrid } from './components/menu-items-grid'
export { CartSidebar } from './components/cart-sidebar'
export { CartItemRow } from './components/cart-item-row'
export { OrderTypeSelector, OrderTypeSelectorMobile } from './components/order-type-selector'
export { CategoryFilter } from './components/category-filter'
export { VariantSelectionDialog } from './components/variant-selection-dialog'
export { LocationSelect, TableSelect, StaffSelect } from './components/order-setup-selects'
export { DesktopMenuContent } from './components/desktop-menu-content'
export { MobileSetupStep } from './components/mobile-setup-step'
export { MobileMenuStep } from './components/mobile-menu-step'
