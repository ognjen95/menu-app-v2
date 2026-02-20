/**
 * Offline Sync Manager
 * 
 * Handles background synchronization of offline operations when
 * connectivity is restored. Processes operations in FIFO order
 * with retry logic and conflict resolution.
 */

import { offlineQueue } from './offline-queue'
import type {
  OfflineOperation,
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  SyncEvent,
  SyncEventType,
} from './types'

type SyncEventListener = (event: SyncEvent) => void

class SyncManager {
  private isSyncing = false
  private listeners: Set<SyncEventListener> = new Set()
  private syncPromise: Promise<void> | null = null

  /**
   * Subscribe to sync events
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Emit a sync event to all listeners
   */
  private emit(type: SyncEventType, operationId?: string, error?: string): void {
    const event: SyncEvent = {
      type,
      operationId,
      error,
      timestamp: new Date().toISOString(),
    }
    this.listeners.forEach(listener => listener(event))
  }

  /**
   * Check if currently syncing
   */
  getIsSyncing(): boolean {
    return this.isSyncing
  }

  /**
   * Start sync process (called when coming online)
   */
  async startSync(): Promise<void> {
    // If already syncing, wait for the current sync to complete
    if (this.syncPromise) {
      return this.syncPromise
    }

    this.syncPromise = this.performSync()
    
    try {
      await this.syncPromise
    } finally {
      this.syncPromise = null
    }
  }

  /**
   * Main sync logic
   */
  private async performSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress, skipping')
      return
    }

    // Check if we're actually online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SyncManager] Still offline, skipping sync')
      return
    }

    // Reset any stuck operations first
    await this.resetStuckOperations()

    const operations = await offlineQueue.getOperations()
    const pendingOps = operations.filter(
      op => op.status === 'pending' || op.status === 'failed'
    )

    if (pendingOps.length === 0) {
      console.log('[SyncManager] No pending operations to sync')
      return
    }

    console.log(`[SyncManager] Starting sync of ${pendingOps.length} operations`)
    this.isSyncing = true
    this.emit('sync:started')

    let successCount = 0
    let failCount = 0

    try {
      // PHASE 1: Process all CREATE_ORDER operations first
      const createOps = pendingOps.filter(op => op.type === 'CREATE_ORDER')
      console.log(`[SyncManager] Phase 1: Processing ${createOps.length} CREATE_ORDER operations`)
      
      for (const operation of createOps) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log('[SyncManager] Went offline during sync, stopping')
          break
        }

        if (!offlineQueue.canRetry(operation)) {
          console.log(`[SyncManager] Operation ${operation.id} exceeded max retries, marking as failed`)
          await offlineQueue.updateOperationStatus(operation.id, 'failed', 'Max retries exceeded')
          failCount++
          continue
        }

        try {
          await this.withTimeout(this.processOperation(operation), 30000, operation.id)
          successCount++
        } catch (error) {
          failCount++
          console.error(`[SyncManager] CREATE_ORDER ${operation.id} failed:`, error)
          if (error instanceof Error && (error.message.includes('timed out') || error.name === 'AbortError')) {
            await offlineQueue.updateOperationStatus(operation.id, 'pending', 'Request timed out')
          }
        }
        await this.delay(100)
      }

      // PHASE 2: Re-fetch operations to get updated payloads (local IDs replaced with server IDs)
      // Then process UPDATE_ORDER_STATUS operations
      const freshOperations = await offlineQueue.getOperations()
      const statusOps = freshOperations.filter(
        op => op.type === 'UPDATE_ORDER_STATUS' && (op.status === 'pending' || op.status === 'failed')
      )
      console.log(`[SyncManager] Phase 2: Processing ${statusOps.length} UPDATE_ORDER_STATUS operations`)

      for (const operation of statusOps) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          console.log('[SyncManager] Went offline during sync, stopping')
          break
        }

        if (!offlineQueue.canRetry(operation)) {
          console.log(`[SyncManager] Operation ${operation.id} exceeded max retries, marking as failed`)
          await offlineQueue.updateOperationStatus(operation.id, 'failed', 'Max retries exceeded')
          failCount++
          continue
        }

        try {
          await this.withTimeout(this.processOperation(operation), 30000, operation.id)
          successCount++
        } catch (error) {
          failCount++
          console.error(`[SyncManager] UPDATE_ORDER_STATUS ${operation.id} failed:`, error)
          if (error instanceof Error && (error.message.includes('timed out') || error.name === 'AbortError')) {
            await offlineQueue.updateOperationStatus(operation.id, 'pending', 'Request timed out')
          }
        }
        await this.delay(100)
      }
    } finally {
      this.isSyncing = false
      console.log(`[SyncManager] Sync completed: ${successCount} success, ${failCount} failed`)
      this.emit('sync:completed')
    }
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: OfflineOperation): Promise<void> {
    console.log(`[SyncManager] Processing operation: ${operation.id} (${operation.type})`)
    this.emit('operation:syncing', operation.id)
    
    await offlineQueue.updateOperationStatus(operation.id, 'syncing')

    try {
      switch (operation.type) {
        case 'CREATE_ORDER':
          await this.syncCreateOrder(operation as OfflineOperation<CreateOrderPayload>)
          break
        case 'UPDATE_ORDER_STATUS':
          // Re-fetch the operation to get potentially updated payload
          // (local order ID may have been replaced with server ID)
          const freshOperation = await offlineQueue.getOperation(operation.id)
          if (!freshOperation) {
            throw new Error(`Operation ${operation.id} no longer exists`)
          }
          await this.syncUpdateStatus(freshOperation as OfflineOperation<UpdateOrderStatusPayload>)
          break
        default:
          throw new Error(`Unknown operation type: ${operation.type}`)
      }

      // Success - remove from queue
      await offlineQueue.removeOperation(operation.id)
      this.emit('operation:success', operation.id)
      console.log(`[SyncManager] Operation ${operation.id} synced successfully`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if this is a retryable error
      if (this.isRetryableError(error)) {
        await offlineQueue.updateOperationStatus(operation.id, 'pending', errorMessage)
        console.log(`[SyncManager] Operation ${operation.id} will be retried`)
      } else {
        await offlineQueue.updateOperationStatus(operation.id, 'failed', errorMessage)
        this.emit('operation:failed', operation.id, errorMessage)
        console.log(`[SyncManager] Operation ${operation.id} marked as failed: ${errorMessage}`)
      }
      
      throw error
    }
  }

  /**
   * Sync a create order operation
   */
  private async syncCreateOrder(operation: OfflineOperation<CreateOrderPayload>): Promise<void> {
    const { _localMetadata, ...orderData } = operation.payload
    
    // Use fetch with AbortController for reliable timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        signal: controller.signal,
        credentials: 'include',
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `Request failed: ${response.status}`)
      }
      
      const result = await response.json()
      const serverId = result.data?.order?.id
      
      if (!serverId) {
        throw new Error('No order ID returned from server')
      }
      
      console.log(`[SyncManager] Order created with server ID: ${serverId}`)
      
      // Update any pending UPDATE_ORDER_STATUS operations that reference the local ID
      if (operation.localId) {
        await this.updatePendingStatusOperations(operation.localId, serverId)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Update pending status operations to use server ID instead of local ID
   */
  private async updatePendingStatusOperations(localId: string, serverId: string): Promise<void> {
    const operations = await offlineQueue.getOperations()
    
    for (const op of operations) {
      if (op.type === 'UPDATE_ORDER_STATUS') {
        const payload = op.payload as UpdateOrderStatusPayload
        if (payload.orderId === localId) {
          console.log(`[SyncManager] Updating operation ${op.id}: ${localId} → ${serverId}`)
          // Update the payload with the server ID
          await offlineQueue.updateOperationPayload(op.id, {
            ...payload,
            orderId: serverId,
          })
        }
      }
    }
  }

  /**
   * Sync an update status operation
   */
  private async syncUpdateStatus(operation: OfflineOperation<UpdateOrderStatusPayload>): Promise<void> {
    const { orderId, status, cancellation_reason } = operation.payload
    
    // Safety check: if orderId is a local ID, the CREATE_ORDER hasn't synced yet
    if (orderId.startsWith('local_')) {
      throw new Error(`Cannot update status: order ${orderId} not yet synced to server`)
    }
    
    // Use fetch with AbortController for reliable timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancellation_reason }),
        signal: controller.signal,
        credentials: 'include',
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `Request failed: ${response.status}`)
      }
      
      console.log(`[SyncManager] Order ${orderId} status updated to ${status}`)
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Check if an error is retryable (network errors, server errors, dependency errors)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      // Network errors are retryable
      if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('connection')
      ) {
        return true
      }
      
      // Server errors (5xx) are retryable
      if (message.includes('500') || message.includes('502') || message.includes('503')) {
        return true
      }
      
      // "Not yet synced" errors are retryable (waiting for dependent operation)
      if (message.includes('not yet synced')) {
        return true
      }
    }
    
    // Client errors (4xx) are not retryable (except specific cases)
    return false
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Wrap a promise with timeout
   */
  private withTimeout<T>(promise: Promise<T>, ms: number, operationId: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation ${operationId} timed out after ${ms}ms`)), ms)
      ),
    ])
  }

  /**
   * Reset any stuck operations (syncing for too long)
   */
  async resetStuckOperations(): Promise<number> {
    const operations = await offlineQueue.getOperations('syncing')
    let resetCount = 0

    for (const op of operations) {
      // If operation has been syncing for more than 30 seconds, reset it
      const syncingDuration = Date.now() - new Date(op.updatedAt).getTime()
      const STUCK_THRESHOLD = 30000 // 30 seconds

      if (syncingDuration > STUCK_THRESHOLD) {
        console.log(`[SyncManager] Resetting stuck operation ${op.id} (syncing for ${syncingDuration}ms)`)
        await offlineQueue.updateOperationStatus(op.id, 'pending', 'Reset after timeout')
        resetCount++
      }
    }

    if (resetCount > 0) {
      console.log(`[SyncManager] Reset ${resetCount} stuck operations`)
    }

    return resetCount
  }

  /**
   * Force retry all failed operations
   */
  async retryAllFailed(): Promise<void> {
    const operations = await offlineQueue.getOperations('failed')
    
    for (const op of operations) {
      try {
        await offlineQueue.retryOperation(op.id)
      } catch (error) {
        console.error(`[SyncManager] Failed to retry operation ${op.id}:`, error)
      }
    }

    // Trigger a new sync
    await this.startSync()
  }

  /**
   * Initialize sync manager - sets up online event listener
   */
  init(): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const handleOnline = () => {
      console.log('[SyncManager] Network online, starting sync')
      // Small delay to ensure network is stable
      setTimeout(() => {
        this.startSync().catch(error => {
          console.error('[SyncManager] Sync failed:', error)
        })
      }, 1000)
    }

    window.addEventListener('online', handleOnline)

    // Initial sync if we're online
    if (navigator.onLine) {
      handleOnline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager()

// Export class for testing
export { SyncManager }
