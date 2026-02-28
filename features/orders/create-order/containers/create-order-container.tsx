'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'

import {
  useLocationState,
  useTeamState,
  useTableState,
  useMenuItemsState,
  useCreateOrder,
  useOrderUIState,
} from '../hooks'
import { buildMenuContentProps } from '../utils/build-menu-content-props'
import type { Location, Table } from '@/lib/types'
import type { MenuItemWithVariants, OrderType, TeamMember } from '../types'

// Lazy load mobile and desktop components
const MobileOrderSheet = dynamic(
  () => import('../components/mobile-order-sheet').then(mod => ({ default: mod.MobileOrderSheet })),
  { ssr: false }
)

const DesktopOrderDialog = dynamic(
  () => import('../components/desktop-order-dialog').then(mod => ({ default: mod.DesktopOrderDialog })),
  { ssr: false }
)

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  selectedLocationId?: string
  tables: Table[]
  team: TeamMember[]
  menuItems: MenuItemWithVariants[]
}

export function CreateOrderContainer({ open, onOpenChange, selectedLocationId: initialLocationId, locations, tables, team, menuItems }: CreateOrderDialogProps) {
  const t = useTranslations('createOrder')
  const tCommon = useTranslations('common')

  // Data state hooks
  const locationState = useLocationState({ locations, initialLocationId })
  const teamState = useTeamState({ team, isOpen: open })
  const tableState = useTableState({ tables })
  const menuState = useMenuItemsState({ menuItems })

  // Order type state (needed before both hooks)
  const [orderType, setOrderType] = useState<OrderType>('dine_in')

  // Order creation hook
  const orderCreation = useCreateOrder({
    locationState,
    tableState,
    menuState,
    teamState,
    orderType,
    onSuccess: () => onOpenChange(false),
    t,
  })

  // UI state hook
  const uiState = useOrderUIState({
    open,
    onResetMenuState: menuState.resetMenuState,
    onResetCustomerForm: useCallback(() =>
      orderCreation.customerInfoForm.reset({ name: '', phone: '', notes: '' }),
      [orderCreation.customerInfoForm]),
    searchQuery: menuState.searchQuery,
  })

  // Build props for menu content components
  const menuContentProps = useMemo(() => buildMenuContentProps({
    locationState,
    tableState,
    teamState,
    teamMembers: team,
    menuState,
    orderType,
    setOrderType,
    setShowCart: uiState.setShowCart,
    t,
  }), [locationState, tableState, teamState, team, menuState, orderType, uiState.setShowCart, t])

  // Shared props for both mobile and desktop
  const sharedProps = useMemo(() => ({
    menuContentProps,
    isCustomerInfoOpen: uiState.isCustomerInfoOpen,
    setIsCustomerInfoOpen: uiState.setIsCustomerInfoOpen,
    cart: menuState.cart,
    cartTotal: menuState.cartTotal,
    cartItemsCount: menuState.cartItemsCount,
    isSubmitting: orderCreation.isSubmitting,
    customerInfoControl: orderCreation.customerInfoForm.control,
    updateQuantity: menuState.updateQuantity,
    removeFromCart: menuState.removeFromCart,
    clearCart: menuState.clearCart,
    handleCreateOrder: orderCreation.handleCreateOrder,
    itemForVariants: menuState.itemForVariants,
    setItemForVariants: menuState.setItemForVariants,
    addToCartDirect: menuState.addToCartDirect,
    t,
    tCommon,
  }), [menuContentProps, uiState.isCustomerInfoOpen, uiState.setIsCustomerInfoOpen, menuState.cart, menuState.cartTotal, menuState.cartItemsCount, menuState.updateQuantity, menuState.removeFromCart, menuState.clearCart, menuState.itemForVariants, menuState.setItemForVariants, menuState.addToCartDirect, orderCreation.isSubmitting, orderCreation.customerInfoForm.control, orderCreation.handleCreateOrder, t, tCommon])

  if (uiState.isMobile) {
    return (
      <MobileOrderSheet
        open={open}
        onOpenChange={onOpenChange}
        {...sharedProps}
        mobileStep={uiState.mobileStep}
        setMobileStep={uiState.setMobileStep}
        mobileSearchInputRef={uiState.mobileSearchInputRef}
        setIsMobileSearchFocused={uiState.setIsMobileSearchFocused}
        showCart={uiState.showCart}
        setShowCart={uiState.setShowCart}
      />
    )
  }

  return (
    <DesktopOrderDialog
      open={open}
      onOpenChange={onOpenChange}
      {...sharedProps}
    />
  )
}

