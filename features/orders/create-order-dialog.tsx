/**
 * @deprecated This file is kept for backward compatibility.
 * Import from './create-order' instead for the refactored DDD structure.
 * 
 * New structure:
 * - containers/create-order-container.tsx - Main orchestrator with all logic
 * - components/* - Presentational/dummy components
 * - hooks/use-create-order-state.ts - All state management
 * - types.ts - Shared TypeScript types
 */
export {
  CreateOrderDialog,
  type CartItem,
  type OrderType,
  type CustomerInfoValues,
  type MenuItemWithVariants,
  getItemQuantities,
} from './create-order'
