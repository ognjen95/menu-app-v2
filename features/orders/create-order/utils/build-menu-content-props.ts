import type { Location, Table } from '@/lib/types'
import type { MenuItemWithVariants, TeamMember, OrderType, Category } from '../types'

type LocationState = {
  locations: Location[]
  selectedLocationId: string
  setSelectedLocationId: (id: string) => void
}

type TableState = {
  tables: Table[]
  selectedTableId: string
  setSelectedTableId: (id: string) => void
}

type TeamState = {
  selectedUserId: string
  setSelectedUserId: (id: string) => void
}

type MenuState = {
  searchQuery: string
  handleSearchChange: (query: string) => void
  categories: Category[]
  selectedCategoryId: string | null
  setSelectedCategoryId: (id: string | null) => void
  filteredItems: MenuItemWithVariants[]
  itemQuantities: Record<string, number>
  recentlyAddedId: string | null
  handleItemClick: (item: MenuItemWithVariants) => void
  updateItemQuantity: (itemId: string, delta: number) => void
  removeOneByItemId: (itemId: string) => void
  cartItemsCount: number
  cartTotal: number
}

type BuildMenuContentPropsParams = {
  locationState: LocationState
  tableState: TableState
  teamState: TeamState
  teamMembers: TeamMember[]
  menuState: MenuState
  orderType: OrderType
  setOrderType: (type: OrderType) => void
  setShowCart: (show: boolean) => void
  t: (key: string) => string
}

export function buildMenuContentProps({
  locationState,
  tableState,
  teamState,
  teamMembers,
  menuState,
  orderType,
  setOrderType,
  setShowCart,
  t,
}: BuildMenuContentPropsParams) {
  return {
    // Locations
    locations: locationState.locations,
    selectedLocationId: locationState.selectedLocationId,
    onLocationChange: locationState.setSelectedLocationId,

    // Tables
    tables: tableState.tables,
    selectedTableId: tableState.selectedTableId,
    onTableChange: tableState.setSelectedTableId,

    // Team
    teamMembers,
    selectedUserId: teamState.selectedUserId,
    onUserChange: teamState.setSelectedUserId,

    // Order type
    orderType,
    onOrderTypeChange: setOrderType,

    // Search
    searchQuery: menuState.searchQuery,
    onSearchChange: menuState.handleSearchChange,

    // Categories
    categories: menuState.categories,
    selectedCategoryId: menuState.selectedCategoryId,
    onCategorySelect: menuState.setSelectedCategoryId,

    // Items
    isLoadingItems: false,
    filteredItems: menuState.filteredItems,
    itemQuantities: menuState.itemQuantities,
    recentlyAddedId: menuState.recentlyAddedId,
    onItemClick: menuState.handleItemClick,
    onQuantityChange: menuState.updateItemQuantity,
    onRemoveOne: menuState.removeOneByItemId,
    cartItemsCount: menuState.cartItemsCount,
    cartTotal: menuState.cartTotal,

    // Cart
    onShowCart: () => setShowCart(true),
    t,
  }
}
