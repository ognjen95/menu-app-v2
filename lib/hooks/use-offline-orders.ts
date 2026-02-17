'use client'

/**
 * Offline-Aware Order Hooks
 * 
 * These hooks wrap the standard order mutations with offline support.
 * When offline, operations are queued in IndexedDB and synced when
 * connectivity is restored.
 */

import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { offlineQueue, syncManager } from '@/lib/offline'
import { orderKeys } from './use-orders'
import type {
  OfflineOperation,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  QueueStats,
} from '@/lib/offline/types'
import type { OrderStatus, OrderWithRelations } from '@/lib/types'

/**
 * Hook to get the current offline queue stats
 */
export function useOfflineQueueStats() {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    syncing: 0,
    failed: 0,
    total: 0,
  })

  useEffect(() => {
    console.log('[useOfflineQueueStats] Subscribing to offlineQueue')
    
    // Initial load
    offlineQueue.getStats().then((s) => {
      console.log('[useOfflineQueueStats] Initial stats:', s)
      setStats(s)
    })

    // Subscribe to changes
    const unsubscribe = offlineQueue.subscribe(() => {
      console.log('[useOfflineQueueStats] Change notification received!')
      offlineQueue.getStats().then((s) => {
        console.log('[useOfflineQueueStats] Updated stats:', s)
        setStats(s)
      })
    })

    return () => {
      console.log('[useOfflineQueueStats] Unsubscribing')
      unsubscribe()
    }
  }, [])

  return stats
}

/**
 * Hook to get all pending offline operations
 */
export function useOfflineOperations() {
  const [operations, setOperations] = useState<OfflineOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOperations = async () => {
      try {
        const ops = await offlineQueue.getOperations()
        setOperations(ops)
      } catch (error) {
        console.error('[useOfflineOperations] Failed to load operations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOperations()

    const unsubscribe = offlineQueue.subscribe(loadOperations)
    return unsubscribe
  }, [])

  return { operations, isLoading }
}

/**
 * Hook to check if sync is in progress
 */
export function useIsSyncing() {
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((event) => {
      if (event.type === 'sync:started') {
        setIsSyncing(true)
      } else if (event.type === 'sync:completed' || event.type === 'sync:failed') {
        setIsSyncing(false)
      }
    })

    return unsubscribe
  }, [])

  return isSyncing
}

/**
 * Hook to manage offline operations (retry, discard)
 */
export function useOfflineOperationActions() {
  const queryClient = useQueryClient()

  const discardOperation = useCallback(async (operationId: string) => {
    try {
      await offlineQueue.discardOperation(operationId)
      toast.success('Operation discarded')
    } catch (error) {
      toast.error('Failed to discard operation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  const retryOperation = useCallback(async (operationId: string) => {
    try {
      await offlineQueue.retryOperation(operationId)
      toast.info('Operation queued for retry')
      
      // Trigger sync if online
      if (navigator.onLine) {
        syncManager.startSync()
      }
    } catch (error) {
      toast.error('Failed to retry operation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  const retryAllFailed = useCallback(async () => {
    try {
      await syncManager.retryAllFailed()
      toast.info('Retrying all failed operations')
    } catch (error) {
      toast.error('Failed to retry operations', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) {
      toast.warning('Cannot sync while offline')
      return
    }

    try {
      await syncManager.startSync()
      // Invalidate queries after sync
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    } catch (error) {
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [queryClient])

  const resetStuckOperations = useCallback(async () => {
    try {
      const count = await syncManager.resetStuckOperations()
      if (count > 0) {
        toast.success(`Reset ${count} stuck operation(s)`)
      } else {
        toast.info('No stuck operations found')
      }
    } catch (error) {
      toast.error('Failed to reset operations', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }, [])

  return {
    discardOperation,
    retryOperation,
    retryAllFailed,
    triggerSync,
    resetStuckOperations,
  }
}

/**
 * Helper to check if an error is a network-related error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // AbortError from timeout
    if (error.name === 'AbortError') return true
    // TypeError is thrown by fetch on network failure
    if (error.name === 'TypeError') return true
    // Check common network error messages
    const msg = error.message.toLowerCase()
    if (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('fetch') ||
      msg.includes('aborted')
    ) {
      return true
    }
  }
  return false
}

/**
 * Offline-aware hook for creating orders
 */
export function useOfflineCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateOrderPayload) => {
      // Try online request first if we appear to be online
      if (navigator.onLine) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            // Server responded with error - this is NOT a network error, throw it
            throw new Error(errorData.error || `Request failed: ${response.status}`)
          }

          const result = await response.json()
          // Success! Return the server response
          return { order: result.data.order as OrderWithRelations, isOffline: false }
        } catch (error) {
          clearTimeout(timeoutId)
          
          // If it's a network error (timeout, no connection, etc.), queue offline
          if (isNetworkError(error)) {
            console.log('[useOfflineCreateOrder] Network error, queuing offline:', error)
            // Continue to offline queue below
          } else {
            // Server error or validation error - re-throw
            throw error
          }
        }
      }

      // Offline or network failed: Queue the operation
      console.log('[useOfflineCreateOrder] Queueing to offline queue...')
      const localId = `local_order_${Date.now()}`
      
      let operation
      try {
        operation = await offlineQueue.addOperation('CREATE_ORDER', data, localId)
        console.log('[useOfflineCreateOrder] Operation queued successfully:', operation.id)
      } catch (queueError) {
        console.error('[useOfflineCreateOrder] Failed to queue operation:', queueError)
        throw queueError
      }
      
      // Return a fake order for optimistic UI
      const fakeOrder: Partial<OrderWithRelations> = {
        id: localId,
        order_number: `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
        location_id: data.location_id,
        table_id: data.table_id,
        type: data.type as any,
        status: (data.status || 'accepted') as OrderStatus,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_notes: data.customer_notes,
        created_at: new Date().toISOString(),
        items: data.items.map((item, index) => ({
          id: `local_item_${index}`,
          order_id: localId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          item_name: 'Loading...',
          status: 'pending' as const,
          selected_options: [],
          options_price: 0,
          created_at: new Date().toISOString(),
          variant_id: null,
          variant_name: null,
          selected_variants: item.selected_variants || null,
          notes: item.notes || null,
          started_at: null,
          completed_at: null,
        })),
        // Add offline marker
        _isOffline: true,
        _offlineOperationId: operation.id,
      } as any

      return { order: fakeOrder as OrderWithRelations, isOffline: true }
    },
    onSuccess: (result) => {
      // Invalidate queries to show the new order
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.active() })

      if (result.isOffline) {
        // Add the offline order to the cache optimistically
        queryClient.setQueryData<{ data: { orders: OrderWithRelations[] } }>(
          orderKeys.active(),
          (old) => {
            if (!old) return old
            return {
              ...old,
              data: {
                ...old.data,
                orders: [result.order, ...(old.data.orders || [])],
              },
            }
          }
        )
      }
    },
  })
}

/**
 * Offline-aware hook for updating order status
 */
export function useOfflineUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      cancellation_reason,
      previousStatus,
      orderNumber,
    }: { 
      orderId: string
      status: OrderStatus
      cancellation_reason?: string
      previousStatus?: OrderStatus
      orderNumber?: string
    }) => {
      // Try online request first if we appear to be online
      if (navigator.onLine) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

        try {
          const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, cancellation_reason }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            // Server responded with error - this is NOT a network error, throw it
            throw new Error(errorData.error || `Request failed: ${response.status}`)
          }

          const result = await response.json()
          // Success! Return the server response
          return { order: result.data.order as OrderWithRelations, isOffline: false }
        } catch (error) {
          clearTimeout(timeoutId)
          
          // If it's a network error (timeout, no connection, etc.), queue offline
          if (isNetworkError(error)) {
            console.log('[useOfflineUpdateOrderStatus] Network error, queuing offline:', error)
            // Continue to offline queue below
          } else {
            // Server error or validation error - re-throw
            throw error
          }
        }
      }

      // Offline or network failed: Queue the operation
      console.log('[useOfflineUpdateOrderStatus] Queueing to offline queue...')
      
      const payload: UpdateOrderStatusPayload = {
        orderId,
        status,
        cancellation_reason,
        _localMetadata: {
          previousStatus: previousStatus || ('placed' as OrderStatus),
          orderNumber,
        },
      }

      try {
        const operation = await offlineQueue.addOperation(
          'UPDATE_ORDER_STATUS',
          payload,
          `status_${orderId}_${Date.now()}`
        )
        console.log('[useOfflineUpdateOrderStatus] Operation queued successfully:', operation.id)

        return { 
          orderId, 
          status, 
          isOffline: true, 
          operationId: operation.id 
        }
      } catch (queueError) {
        console.error('[useOfflineUpdateOrderStatus] Failed to queue operation:', queueError)
        throw queueError
      }
    },
    onSuccess: (result, variables) => {
      // Update the cache optimistically
      queryClient.setQueryData<{ data: { orders: OrderWithRelations[] } }>(
        orderKeys.active(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              orders: old.data.orders.map((order) =>
                order.id === variables.orderId
                  ? { 
                      ...order, 
                      status: variables.status,
                      _isOffline: result.isOffline,
                      _offlineOperationId: result.isOffline ? (result as any).operationId : undefined,
                    }
                  : order
              ),
            },
          }
        }
      )

      // Also update any detail queries
      queryClient.setQueryData<{ data: { order: OrderWithRelations } }>(
        orderKeys.detail(variables.orderId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: {
              ...old.data,
              order: {
                ...old.data.order,
                status: variables.status,
              },
            },
          }
        }
      )
    },
  })
}

/**
 * Initialize offline sync manager
 * Call this in a top-level provider or layout
 */
export function useInitOfflineSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Initialize the sync manager
    const cleanup = syncManager.init()

    // Subscribe to sync events to invalidate queries
    const unsubscribeSyncEvents = syncManager.subscribe((event) => {
      if (event.type === 'sync:completed') {
        // Invalidate all order queries after sync completes
        queryClient.invalidateQueries({ queryKey: orderKeys.all })
        
        const pendingCount = offlineQueue.getPendingCount()
        pendingCount.then((count) => {
          if (count === 0) {
            toast.success('All offline operations synced')
          }
        })
      }

      if (event.type === 'operation:failed' && event.error) {
        toast.error('Failed to sync operation', {
          description: event.error,
        })
      }
    })

    return () => {
      cleanup()
      unsubscribeSyncEvents()
    }
  }, [queryClient])
}

/**
 * Get offline orders from the queue (for display in UI)
 */
export function useOfflineOrders() {
  const { operations } = useOfflineOperations()

  const offlineOrders = operations
    .filter((op) => op.type === 'CREATE_ORDER' && op.status !== 'completed')
    .map((op) => {
      const payload = op.payload as CreateOrderPayload
      return {
        id: op.localId || op.id,
        operationId: op.id,
        status: op.status,
        payload,
        createdAt: op.createdAt,
        lastError: op.lastError,
        retryCount: op.retryCount,
      }
    })

  const pendingStatusUpdates = operations
    .filter((op) => op.type === 'UPDATE_ORDER_STATUS' && op.status !== 'completed')
    .map((op) => {
      const payload = op.payload as UpdateOrderStatusPayload
      return {
        orderId: payload.orderId,
        operationId: op.id,
        newStatus: payload.status,
        operationStatus: op.status,
        lastError: op.lastError,
      }
    })

  return { offlineOrders, pendingStatusUpdates }
}
