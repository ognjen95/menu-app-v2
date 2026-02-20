/**
 * Offline Operations Type Definitions
 * 
 * This module defines types for the offline queue system that enables
 * order creation and status updates when the device is offline.
 */

import type { OrderStatus } from '@/lib/types'

// Operation types supported by the offline queue
export type OfflineOperationType = 'CREATE_ORDER' | 'UPDATE_ORDER_STATUS'

// Status of an operation in the queue
export type OfflineOperationStatus = 'pending' | 'syncing' | 'failed' | 'completed'

// Payload for creating an order offline
export interface CreateOrderPayload {
  location_id: string
  table_id?: string
  type: string
  status?: OrderStatus
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  customer_notes?: string
  items: {
    menu_item_id: string
    variant_id?: string
    quantity: number
    notes?: string
    selected_variants?: {
      id: string
      name: string
      price_adjustment: number
    }[]
    unit_price: number
  }[]
  // Local metadata for optimistic UI
  _localMetadata?: {
    locationName?: string
    tableName?: string
    itemsCount: number
    total: number
    createdAt: string
  }
}

// Payload for updating order status offline
export interface UpdateOrderStatusPayload {
  orderId: string
  status: OrderStatus
  cancellation_reason?: string
  // Local metadata for optimistic UI
  _localMetadata?: {
    previousStatus: OrderStatus
    orderNumber?: string
  }
}

// Union type for all payloads
export type OfflineOperationPayload = CreateOrderPayload | UpdateOrderStatusPayload

// Generic offline operation structure
export interface OfflineOperation<T = OfflineOperationPayload> {
  id: string
  type: OfflineOperationType
  payload: T
  status: OfflineOperationStatus
  createdAt: string
  updatedAt: string
  retryCount: number
  maxRetries: number
  lastError?: string
  localId?: string // For matching optimistic UI updates
}

// Typed operations for convenience
export type CreateOrderOperation = OfflineOperation<CreateOrderPayload>
export type UpdateStatusOperation = OfflineOperation<UpdateOrderStatusPayload>

// Event types for sync manager
export type SyncEventType = 
  | 'sync:started'
  | 'sync:completed'
  | 'sync:failed'
  | 'operation:syncing'
  | 'operation:success'
  | 'operation:failed'
  | 'queue:updated'

export interface SyncEvent {
  type: SyncEventType
  operationId?: string
  error?: string
  timestamp: string
}

// Queue statistics
export interface QueueStats {
  pending: number
  syncing: number
  failed: number
  total: number
}

// Configuration for the offline queue
export interface OfflineQueueConfig {
  maxQueueSize: number
  maxRetries: number
  retryDelayMs: number
  retryBackoffMultiplier: number
}

// Default configuration
export const DEFAULT_OFFLINE_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 100, // Easily adjustable
  maxRetries: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
}
