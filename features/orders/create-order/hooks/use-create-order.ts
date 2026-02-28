'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useOfflineCreateOrder } from '@/lib/hooks/use-offline-orders'
import { toast } from 'sonner'
import type { CustomerInfoValues, OrderType, TeamMember } from '../types'
import { OrderStatus } from '@/lib/types'

type UseCreateOrderProps = {
  locationState: {
    selectedLocationId: string
    selectedLocation?: { name?: string }
  }
  tableState: {
    selectedTableId: string
    selectedTable?: { name?: string }
    resetTable: () => void
  }
  teamState: {
    team: TeamMember[]
    selectedUserId: string
    selectedStaff?: TeamMember
    setSelectedUserId: (userId: string) => void
  }
  menuState: {
    cart: Array<{
      menuItem: { id: string }
      quantity: number
      notes?: string
      selectedVariants?: any[]
      calculatedPrice: number
    }>
    cartTotal: number
    clearCart: () => void
  }
  orderType: OrderType
  onSuccess: () => void
  t: (key: string) => string
  orderStatus?: OrderStatus
}

export function useCreateOrder({
  locationState,
  tableState,
  menuState,
  orderType,
  teamState,
  onSuccess,
  t,
  orderStatus = 'accepted',
}: UseCreateOrderProps) {
  const customerInfoForm = useForm<CustomerInfoValues>({
    defaultValues: { name: '', phone: '', notes: '' },
  })

  console.log({
    location: locationState.selectedLocationId,
    table: tableState.selectedTableId,
  })

  const createOrderMutation = useOfflineCreateOrder()

  const handleCreateOrder = useCallback(async () => {
    if (!locationState.selectedLocationId) {
      toast.error(t('selectLocation'))
      return
    }
    if (menuState.cart.length === 0) {
      toast.error(t('addItemsFirst'))
      return
    }
    if (orderType === 'dine_in' && !tableState.selectedTableId) {
      toast.error(t('selectTable'))
      return
    }

    const customerInfoValues = customerInfoForm.getValues()

    try {
      const result = await createOrderMutation.mutateAsync({
        location_id: locationState.selectedLocationId,
        table_id: orderType === 'dine_in' ? tableState.selectedTableId : undefined,
        type: orderType,
        status: orderStatus,
        user_id: teamState.selectedUserId,
        customer_name: customerInfoValues.name || undefined,
        customer_phone: customerInfoValues.phone || undefined,
        customer_notes: customerInfoValues.notes || undefined,
        items: menuState.cart.map(c => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes,
          selected_variants: c.selectedVariants,
          unit_price: c.calculatedPrice,
        })),
        _localMetadata: {
          locationName: locationState.selectedLocation?.name,
          tableName: tableState.selectedTable?.name,
          itemsCount: menuState.cart.reduce((sum, c) => sum + c.quantity, 0),
          total: menuState.cartTotal,
          createdAt: new Date().toISOString(),
        },
      })

      if (result.isOffline) {
        toast.info(t('orderCreated'), {
          description: 'Order saved offline. Will sync when connected.',
        })
      } else {
        toast.success(t('orderCreated'))
      }

      menuState.clearCart()
      tableState.resetTable()
      customerInfoForm.reset({ name: '', phone: '', notes: '' })
      onSuccess()
    } catch (error: any) {
      toast.error(t('orderFailed'), {
        description: error?.message || 'Unknown error',
      })
    }
  }, [locationState.selectedLocationId, locationState.selectedLocation?.name, menuState, orderType, tableState, teamState.selectedUserId, customerInfoForm, t, createOrderMutation, orderStatus, onSuccess])

  return {
    customerInfoForm,
    handleCreateOrder,
    isSubmitting: createOrderMutation.isPending,
  }
}
