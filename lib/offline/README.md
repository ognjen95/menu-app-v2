# Offline Orders Module

This module provides robust offline functionality for order management in the PWA. When the device goes offline, order creation and status updates are queued locally in IndexedDB and automatically synced when connectivity is restored.

## Features

- **Offline Order Creation**: Create orders while offline, they're queued and synced when online
- **Offline Status Updates**: Change order statuses (via kanban drag-drop) while offline
- **Automatic Sync**: Operations are automatically synced when network connectivity returns
- **Visual Feedback**: Offline orders show badges indicating their sync status
- **Conflict Resolution**: FIFO queue processing with retry logic
- **Error Handling**: Failed operations can be retried or discarded
- **Persistent Queue**: Uses IndexedDB for reliable storage that persists across sessions

## Architecture

```
lib/offline/
├── README.md                 # This file
├── index.ts                  # Module exports
├── types.ts                  # TypeScript types
├── offline-queue.ts          # IndexedDB queue manager
└── sync-manager.ts           # Background sync logic

lib/hooks/
└── use-offline-orders.ts     # React hooks for offline functionality

components/ui/
└── offline-sync-indicator.tsx # UI component showing sync status
```

## Configuration

The offline queue has configurable limits in `types.ts`:

```typescript
export const DEFAULT_OFFLINE_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 100,      // Max pending operations (adjustable)
  maxRetries: 3,          // Retry attempts before marking as failed
  retryDelayMs: 1000,     // Initial retry delay
  retryBackoffMultiplier: 2, // Exponential backoff multiplier
}
```

To change the queue size, update `maxQueueSize` in `DEFAULT_OFFLINE_CONFIG`.

## Usage

### 1. Initialize Offline Sync (Required)

The sync manager must be initialized in a top-level component. This is done automatically in the orders page:

```tsx
import { useInitOfflineSync } from '@/lib/hooks/use-offline-orders'

function OrdersPage() {
  useInitOfflineSync() // Initializes sync manager and listens for online events
  // ...
}
```

### 2. Create Orders (Offline-Aware)

The order creation hook automatically handles offline scenarios:

```tsx
import { useOfflineCreateOrder } from '@/lib/hooks/use-offline-orders'

function CreateOrderForm() {
  const createOrder = useOfflineCreateOrder()

  const handleSubmit = async (data) => {
    const result = await createOrder.mutateAsync(data)
    
    if (result.isOffline) {
      // Order was queued offline
      toast.info('Order saved offline')
    } else {
      // Order was created online
      toast.success('Order created')
    }
  }
}
```

### 3. Update Order Status (Offline-Aware)

The status update hook works similarly:

```tsx
import { useOfflineUpdateOrderStatus } from '@/lib/hooks/use-offline-orders'

function OrderCard({ order }) {
  const updateStatus = useOfflineUpdateOrderStatus()

  const handleStatusChange = async (newStatus) => {
    const result = await updateStatus.mutateAsync({
      orderId: order.id,
      status: newStatus,
      previousStatus: order.status,
    })
    
    // UI updates optimistically regardless of online/offline status
  }
}
```

### 4. Display Sync Indicator

Add the floating sync indicator to show pending operations:

```tsx
import { OfflineSyncIndicator } from '@/components/ui/offline-sync-indicator'

function Layout() {
  return (
    <div>
      {/* Your content */}
      <OfflineSyncIndicator />
    </div>
  )
}
```

### 5. Show Offline Badges on Orders

Use the badge components to indicate offline/pending status:

```tsx
import { OfflineBadge, PendingSyncBadge } from '@/components/ui/offline-sync-indicator'

function OrderCard({ order, isOfflineOrder, hasPendingSync }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span>{order.order_number}</span>
        {isOfflineOrder && <OfflineBadge />}
        {hasPendingSync && <PendingSyncBadge />}
      </div>
    </Card>
  )
}
```

## Hooks Reference

### `useInitOfflineSync()`
Initializes the sync manager. Call once in a top-level component.

### `useOfflineCreateOrder()`
Returns a mutation for creating orders with offline support.

### `useOfflineUpdateOrderStatus()`
Returns a mutation for updating order status with offline support.

### `useOfflineQueueStats()`
Returns queue statistics: `{ pending, syncing, failed, total }`

### `useOfflineOperations()`
Returns all offline operations: `{ operations, isLoading }`

### `useOfflineOrders()`
Returns processed offline data: `{ offlineOrders, pendingStatusUpdates }`

### `useIsSyncing()`
Returns `true` when sync is in progress.

### `useOfflineOperationActions()`
Returns action handlers:
- `discardOperation(id)` - Remove a failed operation
- `retryOperation(id)` - Retry a failed operation
- `retryAllFailed()` - Retry all failed operations
- `triggerSync()` - Manually start sync

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Creates Order                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Check Online?  │
                    └─────────────────┘
                     │              │
           ┌─────────┘              └─────────┐
           ▼                                  ▼
    ┌─────────────┐                   ┌─────────────┐
    │   ONLINE    │                   │   OFFLINE   │
    └─────────────┘                   └─────────────┘
           │                                  │
           ▼                                  ▼
    ┌─────────────┐                   ┌─────────────┐
    │  API Call   │                   │ IndexedDB   │
    │  (Direct)   │                   │   Queue     │
    └─────────────┘                   └─────────────┘
           │                                  │
           ▼                                  ▼
    ┌─────────────┐                   ┌─────────────┐
    │  Success!   │                   │ Optimistic  │
    │             │                   │ UI Update   │
    └─────────────┘                   └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │ "Back       │
                                      │  Online"    │
                                      │  Event      │
                                      └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │ Sync        │
                                      │ Manager     │
                                      │ Processes   │
                                      │ Queue       │
                                      └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │ Invalidate  │
                                      │ Queries &   │
                                      │ Update UI   │
                                      └─────────────┘
```

## Error Handling

### Retryable Errors
These errors will be automatically retried (up to `maxRetries`):
- Network errors
- Timeout errors
- Server errors (5xx)

### Non-Retryable Errors
These errors mark the operation as failed immediately:
- Validation errors (4xx)
- Authentication errors (401, 403)
- Not found errors (404)

### Failed Operations
When an operation fails:
1. It's marked as `failed` in the queue
2. The sync indicator shows a warning badge
3. User can choose to:
   - **Retry**: Resets status to `pending` and attempts sync again
   - **Discard**: Permanently removes the operation from queue

## Best Practices

1. **Always check `result.isOffline`** when creating orders to show appropriate feedback
2. **Don't rely on server IDs** for offline orders until sync completes
3. **Use optimistic updates** for immediate UI feedback
4. **Initialize sync early** - call `useInitOfflineSync()` in a top-level component
5. **Handle queue full errors** - the queue is limited to prevent abuse

## Troubleshooting

### Queue not syncing
- Check browser console for `[SyncManager]` logs
- Verify network connectivity with browser DevTools
- Try manual sync with `triggerSync()`

### Operations stuck in "syncing"
- May indicate a hung request
- Refresh the page to reset sync state
- Operations will be retried on next online event

### IndexedDB errors
- Clear browser data if IndexedDB is corrupted
- Check storage quota in browser settings

## Testing Offline Mode

1. **Chrome DevTools**: Network tab → "Offline" checkbox
2. **Real device**: Enable airplane mode
3. **Simulate slow network**: Network throttling in DevTools

## Dependencies

- IndexedDB (browser API)
- React Query (for cache management)
- Sonner (for toast notifications)

## Files Modified for Integration

- `components/providers/sw-register.tsx` - Sync manager initialization
- `features/orders/create-order/hooks/use-create-order-state.ts` - Offline-aware order creation
- `features/orders/orders-list/components/orders-kanban.tsx` - Offline badges
- `features/orders/orders-list/components/order-card.tsx` - Offline badge display
- `app/dashboard/(main)/orders/page.tsx` - Sync indicator integration
