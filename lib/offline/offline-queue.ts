/**
 * Offline Queue Manager
 * 
 * IndexedDB-based queue for storing and managing offline operations.
 * Supports order creation and status updates with FIFO processing.
 */

import type {
  OfflineOperation,
  OfflineOperationType,
  OfflineOperationStatus,
  OfflineOperationPayload,
  QueueStats,
  OfflineQueueConfig,
} from './types'
import { DEFAULT_OFFLINE_CONFIG } from './types'

const DB_NAME = 'menu-app-offline'
const DB_VERSION = 1
const STORE_NAME = 'operations'

class OfflineQueueManager {
  private db: IDBDatabase | null = null
  private config: OfflineQueueConfig
  private listeners: Set<() => void> = new Set()

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_OFFLINE_CONFIG, ...config }
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('[OfflineQueue] IndexedDB not available')
        resolve()
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to open database:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[OfflineQueue] Database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create the operations store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('type', 'type', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('localId', 'localId', { unique: false })
          console.log('[OfflineQueue] Object store created')
        }
      }
    })
  }

  /**
   * Add a listener for queue changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    console.log('[OfflineQueue] Notifying', this.listeners.size, 'listeners')
    this.listeners.forEach(listener => listener())
  }

  /**
   * Generate a unique ID for operations
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Add an operation to the queue
   */
  async addOperation<T extends OfflineOperationPayload>(
    type: OfflineOperationType,
    payload: T,
    localId?: string
  ): Promise<OfflineOperation<T>> {
    console.log('[OfflineQueue] addOperation called:', type, localId)
    await this.init()
    if (!this.db) {
      console.error('[OfflineQueue] Database not initialized after init()')
      throw new Error('Database not initialized')
    }
    console.log('[OfflineQueue] Database ready, adding operation...')

    // Check queue size limit
    const stats = await this.getStats()
    if (stats.total >= this.config.maxQueueSize) {
      throw new Error(`Queue is full (max ${this.config.maxQueueSize} operations). Please wait for sync or discard old operations.`)
    }

    const now = new Date().toISOString()
    const operation: OfflineOperation<T> = {
      id: this.generateId(),
      type,
      payload,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      localId: localId || this.generateId(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(operation)

      request.onsuccess = () => {
        console.log('[OfflineQueue] Operation added:', operation.id, type)
        this.notifyListeners()
        resolve(operation)
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to add operation:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get all operations, optionally filtered by status
   */
  async getOperations(status?: OfflineOperationStatus): Promise<OfflineOperation[]> {
    await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      let request: IDBRequest<OfflineOperation[]>
      
      if (status) {
        const index = store.index('status')
        request = index.getAll(status)
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => {
        // Sort by createdAt for FIFO processing
        const operations = request.result.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        resolve(operations)
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to get operations:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get a single operation by ID
   */
  async getOperation(id: string): Promise<OfflineOperation | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to get operation:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get operation by local ID (for matching optimistic updates)
   */
  async getOperationByLocalId(localId: string): Promise<OfflineOperation | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('localId')
      const request = index.get(localId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to get operation by localId:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Update an operation's status
   */
  async updateOperationStatus(
    id: string,
    status: OfflineOperationStatus,
    error?: string
  ): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (!operation) {
          reject(new Error(`Operation ${id} not found`))
          return
        }

        operation.status = status
        operation.updatedAt = new Date().toISOString()
        
        if (error) {
          operation.lastError = error
        }

        if (status === 'syncing') {
          operation.retryCount += 1
        }

        const putRequest = store.put(operation)

        putRequest.onsuccess = () => {
          console.log('[OfflineQueue] Operation status updated:', id, status)
          this.notifyListeners()
          resolve()
        }

        putRequest.onerror = () => {
          console.error('[OfflineQueue] Failed to update operation:', putRequest.error)
          reject(putRequest.error)
        }
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    })
  }

  /**
   * Update an operation's payload (e.g., to replace local ID with server ID)
   */
  async updateOperationPayload<T>(id: string, payload: T): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const operation = getRequest.result
        if (!operation) {
          reject(new Error(`Operation ${id} not found`))
          return
        }

        operation.payload = payload
        operation.updatedAt = new Date().toISOString()

        const putRequest = store.put(operation)

        putRequest.onsuccess = () => {
          console.log('[OfflineQueue] Operation payload updated:', id)
          this.notifyListeners()
          resolve()
        }

        putRequest.onerror = () => {
          console.error('[OfflineQueue] Failed to update operation payload:', putRequest.error)
          reject(putRequest.error)
        }
      }

      getRequest.onerror = () => {
        reject(getRequest.error)
      }
    })
  }

  /**
   * Remove an operation from the queue
   */
  async removeOperation(id: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log('[OfflineQueue] Operation removed:', id)
        this.notifyListeners()
        resolve()
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to remove operation:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const operations = await this.getOperations()
    
    return {
      pending: operations.filter(op => op.status === 'pending').length,
      syncing: operations.filter(op => op.status === 'syncing').length,
      failed: operations.filter(op => op.status === 'failed').length,
      total: operations.length,
    }
  }

  /**
   * Get pending operations count (for UI indicator)
   */
  async getPendingCount(): Promise<number> {
    const operations = await this.getOperations()
    return operations.filter(op => op.status === 'pending' || op.status === 'failed').length
  }

  /**
   * Clear all completed operations
   */
  async clearCompleted(): Promise<void> {
    const operations = await this.getOperations('completed')
    for (const op of operations) {
      await this.removeOperation(op.id)
    }
  }

  /**
   * Clear all operations (use with caution)
   */
  async clearAll(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('[OfflineQueue] All operations cleared')
        this.notifyListeners()
        resolve()
      }

      request.onerror = () => {
        console.error('[OfflineQueue] Failed to clear operations:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Discard (remove) a failed operation
   */
  async discardOperation(id: string): Promise<void> {
    const operation = await this.getOperation(id)
    if (!operation) {
      throw new Error(`Operation ${id} not found`)
    }
    
    await this.removeOperation(id)
    console.log('[OfflineQueue] Operation discarded:', id)
  }

  /**
   * Retry a failed operation (reset status to pending)
   */
  async retryOperation(id: string): Promise<void> {
    const operation = await this.getOperation(id)
    if (!operation) {
      throw new Error(`Operation ${id} not found`)
    }
    
    if (operation.status !== 'failed') {
      throw new Error(`Operation ${id} is not in failed state`)
    }

    await this.updateOperationStatus(id, 'pending')
    console.log('[OfflineQueue] Operation marked for retry:', id)
  }

  /**
   * Check if an operation can be retried
   */
  canRetry(operation: OfflineOperation): boolean {
    return operation.retryCount < operation.maxRetries
  }

  /**
   * Get configuration
   */
  getConfig(): OfflineQueueConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OfflineQueueConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager()

// Export class for testing
export { OfflineQueueManager }
