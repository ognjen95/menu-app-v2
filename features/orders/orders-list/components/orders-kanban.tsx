'use client'

import { memo, useRef, useState, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Currency, OrderStatus, OrderWithRelations } from '@/lib/types'
import { OrderCard, statusConfig } from './order-card'
import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { getKanbanGridTemplate } from './orders-kanban-grid'
import { useOfflineOrders } from '@/lib/hooks/use-offline-orders'

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served']

interface OrdersKanbanProps {
  orders: OrderWithRelations[]
  currency?: Currency
  selectedStatuses: Set<OrderStatus>
  onSelectOrder: (order: OrderWithRelations) => void
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>
  onCompleteOrder?: (orderId: string) => void
  onCancelOrder?: (orderId: string) => void
}

// Draggable Order Card wrapper
function DraggableOrderCard({
  order,
  currency,
  onSelect,
  onComplete,
  onCancel,
  isOfflineOrder,
  hasPendingSync,
}: {
  order: OrderWithRelations
  onSelect: (order: OrderWithRelations) => void
  onComplete?: (orderId: string) => void
  onCancel?: (orderId: string) => void
  isOfflineOrder?: boolean
  hasPendingSync?: boolean
  currency?: Currency
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: order.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
    >
      <OrderCard
        currency={currency}
        order={order}
        onSelect={onSelect}
        onComplete={onComplete}
        onCancel={onCancel}
        isOfflineOrder={isOfflineOrder}
        hasPendingSync={hasPendingSync}
      />
    </div>
  )
}

// Droppable Column
function KanbanColumn({
  status,
  orders,
  currency,
  onSelectOrder,
  onCompleteOrder,
  onCancelOrder,
  pendingStatusOrderIds,
}: {
  status: OrderStatus
  orders: OrderWithRelations[]
  onSelectOrder: (order: OrderWithRelations) => void
  onCompleteOrder?: (orderId: string) => void
  onCancelOrder?: (orderId: string) => void
  pendingStatusOrderIds: Set<string>
  currency?: Currency
}) {
  const t = useTranslations('ordersPage')
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
        <div className={cn("h-3 w-3 rounded-full", statusConfig[status].color)} />
        <h2 className="font-semibold">{t(`status.${status}`)}</h2>
        <Badge variant="secondary">{orders.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-4 flex-1 rounded-lg transition-colors p-3 -m-3",
          isOver && "bg-primary/10 ring-2 ring-primary/30"
        )}
      >
        {orders.map((order) => {
          // Check if this order is offline or has pending status update
          const isOfflineOrder = order.id.startsWith('local_') || (order as any)._isOffline
          const hasPendingSync = pendingStatusOrderIds.has(order.id)

          return (
            <DraggableOrderCard
              key={order.id}
              order={order}
              onSelect={onSelectOrder}
              onComplete={onCompleteOrder}
              onCancel={onCancelOrder}
              isOfflineOrder={isOfflineOrder}
              hasPendingSync={hasPendingSync}
              currency={currency}
            />
          )
        })}
        {orders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            {(() => {
              const Icon = statusConfig[status].icon
              return <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            })()}
            <p className="text-sm">{t('noOrders')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const OrdersKanban = memo(function OrdersKanban({
  orders,
  selectedStatuses,
  onSelectOrder,
  onUpdateStatus,
  onCompleteOrder,
  onCancelOrder,
  currency
}: OrdersKanbanProps) {
  const t = useTranslations('ordersPage')
  const kanbanRef = useRef<HTMLDivElement>(null)
  const [isDraggingScroll, setIsDraggingScroll] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [activeOrder, setActiveOrder] = useState<OrderWithRelations | null>(null)

  // Optimistic state - tracks pending status changes
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, OrderStatus>>({})

  // Get offline orders with pending status updates
  const { pendingStatusUpdates } = useOfflineOrders()
  const pendingStatusOrderIds = useMemo(
    () => new Set(pendingStatusUpdates.map(u => u.orderId)),
    [pendingStatusUpdates]
  )

  // DnD sensors - pointer only with distance constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  )

  // Apply optimistic updates to orders AND clean up stale optimistic updates
  const ordersWithOptimistic = useMemo(() => {
    // Clean up optimistic updates that match the server state
    const staleUpdates = Object.entries(optimisticUpdates).filter(
      ([orderId, status]) => {
        const order = orders.find(o => o.id === orderId)
        return order && order.status === status
      }
    )

    if (staleUpdates.length > 0) {
      // Schedule cleanup for next tick to avoid state update during render
      setTimeout(() => {
        setOptimisticUpdates(prev => {
          const next = { ...prev }
          staleUpdates.forEach(([orderId]) => delete next[orderId])
          return next
        })
      }, 0)
    }

    return orders.map(order => {
      if (optimisticUpdates[order.id]) {
        return { ...order, status: optimisticUpdates[order.id] }
      }
      return order
    })
  }, [orders, optimisticUpdates])

  // Group orders by status (with optimistic updates applied)
  const ordersByStatus = useMemo(() => {
    return ACTIVE_STATUSES.reduce((acc, status) => {
      acc[status] = ordersWithOptimistic.filter(o => o.status === status)
      return acc
    }, {} as Record<OrderStatus, OrderWithRelations[]>)
  }, [ordersWithOptimistic])

  const visibleStatuses = useMemo(() => ACTIVE_STATUSES.filter(status => selectedStatuses.has(status)), [selectedStatuses])
  const gridTemplate = useMemo(() => getKanbanGridTemplate(visibleStatuses.length), [visibleStatuses.length])

  // Drag scroll handlers - disabled when dragging a card
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!kanbanRef.current || activeOrder) return // Don't start scroll if dragging card
    const target = e.target as HTMLElement
    // Don't start scroll drag if clicking on a draggable card or interactive element
    if (target.closest('button, a, input, [role="button"], [data-no-drag], [data-radix-collection-item], .cursor-grab, .touch-none')) {
      return
    }
    setIsDraggingScroll(true)
    setStartX(e.pageX - kanbanRef.current.offsetLeft)
    setScrollLeft(kanbanRef.current.scrollLeft)
    kanbanRef.current.style.cursor = 'grabbing'
  }, [activeOrder])

  const handleMouseUp = useCallback(() => {
    setIsDraggingScroll(false)
    if (kanbanRef.current) {
      kanbanRef.current.style.cursor = 'grab'
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingScroll || !kanbanRef.current) return
    e.preventDefault()
    const x = e.pageX - kanbanRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    kanbanRef.current.scrollLeft = scrollLeft - walk
  }, [isDraggingScroll, startX, scrollLeft])

  const handleMouseLeave = useCallback(() => {
    if (isDraggingScroll) {
      setIsDraggingScroll(false)
      if (kanbanRef.current) {
        kanbanRef.current.style.cursor = 'grab'
      }
    }
  }, [isDraggingScroll])

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const order = ordersWithOptimistic.find(o => o.id === active.id)
    if (order) {
      setActiveOrder(order)
    }
  }, [ordersWithOptimistic])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveOrder(null)

    if (!over) return

    const orderId = active.id as string
    const order = orders.find(o => o.id === orderId)
    if (!order) return

    // Check if dropped on a different status column
    const newStatus = over.id as OrderStatus
    if (!ACTIVE_STATUSES.includes(newStatus) || order.status === newStatus) {
      return
    }

    const statusLabel = t(`status.${newStatus}`)

    // Apply optimistic update immediately
    setOptimisticUpdates(prev => ({ ...prev, [orderId]: newStatus }))

    try {
      await onUpdateStatus(orderId, newStatus)

      // Don't clear optimistic update here - let it stay until server data arrives
      // The useMemo above will auto-cleanup when server state matches optimistic state

      toast.success(t('statusChanged') || 'Status updated', {
        description: `Order moved to ${statusLabel}`,
      })
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const next = { ...prev }
        delete next[orderId]
        return next
      })

      toast.error(t('statusChangeFailed') || 'Failed to update status', {
        description: error instanceof Error ? error.message : 'Please try again',
      })
    }
  }, [orders, onUpdateStatus, t])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={kanbanRef}
        className="overflow-x-auto lg:overflow-x-hidden cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          className="grid  min-h-[calc(100vh-280px)] pb-4 items-stretch gap-3"
          style={{ gridTemplateColumns: gridTemplate }}
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {visibleStatuses.map((status, colIndex) => (
            <motion.div
              key={status}
              variants={staggerItemScale}
              custom={colIndex}
              className="h-full"
            >
              <KanbanColumn
                status={status}
                currency={currency}
                orders={ordersByStatus[status] || []}
                onSelectOrder={onSelectOrder}
                onCompleteOrder={onCompleteOrder}
                onCancelOrder={onCancelOrder}
                pendingStatusOrderIds={pendingStatusOrderIds}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <DragOverlay>
        {activeOrder && (
          <div className="rotate-3 scale-105">
            <OrderCard order={activeOrder} onSelect={() => { }} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
})
