'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiPatch } from '@/lib/api'
import type { Order, OrderItem, OrderStatus, OrderWithRelations } from '@/lib/types'

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  active: (locationId?: string) => [...orderKeys.all, 'active', locationId] as const,
  kitchen: (locationId: string) => [...orderKeys.all, 'kitchen', locationId] as const,
}

// Types
export interface OrderFilters {
  locationId?: string
  status?: OrderStatus | OrderStatus[]
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

type OrdersResponseData = { 
  orders: OrderWithRelations[]
  total: number
  page: number
  limit: number
}

type OrdersResponse = { data: OrdersResponseData }

type OrderResponse = { data: { order: OrderWithRelations } }

type CreateOrderInput = {
  location_id: string
  table_id?: string
  type: string
  status?: OrderStatus
  user_id?: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_notes?: string
  items: {
    menu_item_id: string
    variant_id?: string
    quantity: number
    selected_options?: { option_id: string }[]
    notes?: string
  }[]
}

type UpdateOrderStatusInput = {
  id: string
  status: OrderStatus
  user_id?: string
  cancellation_reason?: string
}

type AddOrderItemInput = {
  order_id: string
  menu_item_id: string
  variant_id?: string
  quantity: number
  selected_options?: { option_id: string }[]
  notes?: string
}

// Hooks
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => {
      const params: Record<string, string> = {}
      if (filters.locationId) params.location_id = filters.locationId
      if (filters.status) {
        params.status = Array.isArray(filters.status) 
          ? filters.status.join(',') 
          : filters.status
      }
      if (filters.type) params.type = filters.type
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo
      if (filters.page) params.page = String(filters.page)
      if (filters.limit) params.limit = String(filters.limit)
      
      return apiGet<OrdersResponse>('/orders', params)
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => apiGet<OrderResponse>(`/orders/${id}`),
    enabled: !!id,
  })
}

export function useActiveOrders(locationId?: string, options?: { disablePolling?: boolean }) {
  return useQuery({
    queryKey: orderKeys.active(locationId),
    queryFn: () => apiGet<OrdersResponse>('/orders/active', locationId ? { location_id: locationId } : undefined),
    refetchInterval: options?.disablePolling ? false : 10000, // Refetch every 10 seconds unless disabled
  })
}

export function useKitchenOrders(locationId: string) {
  return useQuery({
    queryKey: orderKeys.kitchen(locationId),
    queryFn: () => apiGet<OrdersResponse>(`/orders/kitchen`, { location_id: locationId }),
    enabled: !!locationId,
    refetchInterval: 5000, // Refetch every 5 seconds for kitchen view
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateOrderInput) => apiPost<OrderResponse>('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.active() })
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, user_id, cancellation_reason }: UpdateOrderStatusInput) =>
      apiPatch<OrderResponse>(`/orders/${id}/status`, { status, user_id, cancellation_reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.active() })
      queryClient.invalidateQueries({ queryKey: orderKeys.kitchen('') })
    },
  })
}

export function useAddOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, ...data }: AddOrderItemInput) =>
      apiPost<{ item: OrderItem }>(`/orders/${order_id}/items`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) })
    },
  })
}

export function useUpdateOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      order_id, 
      item_id, 
      ...data 
    }: { 
      order_id: string
      item_id: string 
      quantity?: number
      notes?: string 
    }) => apiPut<{ item: OrderItem }>(`/orders/${order_id}/items/${item_id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) })
    },
  })
}

export function useRemoveOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ order_id, item_id }: { order_id: string; item_id: string }) =>
      apiPut<{ success: boolean }>(`/orders/${order_id}/items/${item_id}`, { quantity: 0 }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) })
    },
  })
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      order_id, 
      item_id, 
      status 
    }: { 
      order_id: string
      item_id: string
      status: 'pending' | 'preparing' | 'ready'
    }) => apiPatch<{ item: OrderItem }>(`/orders/${order_id}/items/${item_id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.order_id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.kitchen('') })
    },
  })
}
