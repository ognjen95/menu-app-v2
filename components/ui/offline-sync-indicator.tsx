'use client'

/**
 * Offline Sync Indicator
 * 
 * A floating indicator that shows pending offline operations
 * and allows users to manage the sync queue.
 */

import { useState, useEffect } from 'react'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  Package,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useOfflineStatus } from '@/components/providers/sw-register'
import {
  useOfflineQueueStats,
  useOfflineOperations,
  useIsSyncing,
  useOfflineOperationActions,
} from '@/lib/hooks/use-offline-orders'
import type { OfflineOperation, CreateOrderPayload, UpdateOrderStatusPayload } from '@/lib/offline/types'
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog'

function OperationIcon({ type }: { type: string }) {
  switch (type) {
    case 'CREATE_ORDER':
      return <Package className="h-4 w-4" />
    case 'UPDATE_ORDER_STATUS':
      return <ArrowUpDown className="h-4 w-4" />
    default:
      return <Cloud className="h-4 w-4" />
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Cloud className="h-4 w-4 text-muted-foreground" />
    case 'syncing':
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-destructive" />
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-success" />
    default:
      return null
  }
}

function OperationItem({
  operation,
  onRetry,
  onDiscard,
  onReset,
}: {
  operation: OfflineOperation
  onRetry: (id: string) => void
  onDiscard: (id: string) => void
  onReset: (id: string) => void
}) {
  const [discardConfirm, setDiscardConfirm] = useState(false)

  const getDescription = () => {
    if (operation.type === 'CREATE_ORDER') {
      const payload = operation.payload as CreateOrderPayload
      return `New order (${payload.items.length} items)`
    }
    if (operation.type === 'UPDATE_ORDER_STATUS') {
      const payload = operation.payload as UpdateOrderStatusPayload
      return `Update status to "${payload.status}"`
    }
    return operation.type
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
        <OperationIcon type={operation.type} />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">{getDescription()}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(operation.createdAt).toLocaleTimeString()}
            {operation.lastError && (
              <span className="text-destructive ml-2">• {operation.lastError}</span>
            )}
          </p>
        </div>
        <StatusIcon status={operation.status} />
        {/* Actions for syncing operations */}
        {operation.status === 'syncing' && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onReset(operation.id)}
              title="Reset (stuck)"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {/* Actions for failed operations */}
        {operation.status === 'failed' && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onRetry(operation.id)}
              title="Retry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDiscardConfirm(true)}
              title="Discard"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={discardConfirm}
        onOpenChange={setDiscardConfirm}
        title="Discard Operation"
        description="Are you sure you want to discard this offline operation? This action cannot be undone."
        warningMessage="The order or status change will be permanently lost."
        confirmText="Discard"
        cancelText="Cancel"
        onConfirm={() => {
          onDiscard(operation.id)
          setDiscardConfirm(false)
        }}
      />
    </>
  )
}

export function OfflineSyncIndicator() {
  const { isOffline } = useOfflineStatus()
  const stats = useOfflineQueueStats()
  const { operations, isLoading } = useOfflineOperations()
  const isSyncing = useIsSyncing()
  const { discardOperation, retryOperation, retryAllFailed, triggerSync, resetStuckOperations } = useOfflineOperationActions()
  const [isExpanded, setIsExpanded] = useState(false)

  console.log('OfflineSyncIndicator', {
    isOffline,
    operations,
    stats
  })

  // Wrapper for resetting stuck operations (ignores the id, resets all)
  const handleResetStuck = async (_id: string) => {
    await resetStuckOperations()
  }

  // Auto-expand when there are failed or stuck syncing operations
  useEffect(() => {
    if (stats.failed > 0 || stats.syncing > 0) {
      setIsExpanded(true)
    }
  }, [stats.failed, stats.syncing])

  // Don't show if no pending operations and online
  if (stats.total === 0 && !isOffline) {
    return null
  }

  // Filter and sort: CREATE_ORDER first, then UPDATE_ORDER_STATUS (matches sync order)
  const pendingOps = operations
    .filter((op) => op.status === 'pending' || op.status === 'syncing' || op.status === 'failed')
    .sort((a, b) => {
      const typeOrder = { 'CREATE_ORDER': 0, 'UPDATE_ORDER_STATUS': 1 }
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 2
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 2
      if (aOrder !== bOrder) return aOrder - bOrder
      // Within same type, maintain FIFO order
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className={cn(
          "rounded-lg border shadow-lg transition-all",
          "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
          isOffline ? "border-amber-500/50" : "border-border"
        )}>
          {/* Header */}
          <CollapsibleTrigger asChild>
            <button className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className={cn(
                "p-2 rounded-full",
                isOffline ? "bg-amber-500/20 text-amber-600" : "bg-primary/20 text-primary"
              )}>
                {isOffline ? (
                  <CloudOff className="h-4 w-4" />
                ) : isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4" />
                )}
              </div>

              <div className="flex-1 text-left">
                <p className="font-medium text-sm">
                  {isOffline ? 'Offline Mode' : isSyncing ? 'Syncing...' : 'Saved Locally'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isOffline ? (
                    stats.pending > 0 ? `${stats.pending} will sync when online` : 'No pending operations'
                  ) : isSyncing ? (
                    `${stats.syncing} syncing...`
                  ) : stats.pending > 0 ? (
                    `${stats.pending} pending • Will auto-sync`
                  ) : stats.failed > 0 ? (
                    <span className="text-destructive"> • {stats.failed} failed</span>
                  ) : null}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {stats.total > 0 && (
                  <Badge
                    variant={stats.failed > 0 ? "destructive" : "secondary"}
                    className="h-6"
                  >
                    {stats.total}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="border-t">
              {/* Actions */}
              <div className="p-2 flex gap-2 border-b">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={triggerSync}
                  disabled={isOffline || isSyncing || stats.pending === 0}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
                  Sync Now
                </Button>
                {stats.syncing > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetStuckOperations}
                    disabled={isOffline}
                  >
                    Reset Stuck
                  </Button>
                )}
                {stats.failed > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryAllFailed}
                    disabled={isOffline || isSyncing}
                  >
                    Retry All
                  </Button>
                )}
              </div>

              {/* Operations List */}
              <ScrollArea className="h-48">
                <div className="p-2 space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingOps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>All operations synced</p>
                    </div>
                  ) : (
                    pendingOps.map((op) => (
                      <OperationItem
                        key={op.id}
                        operation={op}
                        onRetry={retryOperation}
                        onDiscard={discardOperation}
                        onReset={handleResetStuck}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}

/**
 * Compact offline badge for order cards
 */
export function OfflineBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs",
        className
      )}
    >
      <CloudOff className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  )
}

/**
 * Pending sync badge for orders with pending status updates
 */
export function PendingSyncBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs",
        className
      )}
    >
      <Cloud className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  )
}
