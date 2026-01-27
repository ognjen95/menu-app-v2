'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useActiveOrders, useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  Truck,
  Store,
  User,
  MoreVertical,
  RefreshCw,
  Table,
  History,
  LayoutGrid,
  Columns,
  Volume2,
  VolumeX,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  MessageSquare,
  Info,
  Plus,
  Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrderLogsDialog } from '@/components/features/orders/OrderLogsDialog'
import { CreateOrderDialog } from '@/components/features/orders/create-order-dialog'
import type { OrderStatus, OrderWithRelations, Location } from '@/lib/types'

const statusConfig: Record<OrderStatus, { label: string; color: string; badgeColor: string; buttonColor: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-500', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', buttonColor: 'bg-gray-500 hover:bg-gray-600 text-white', icon: Clock },
  placed: { label: 'New', color: 'bg-blue-500', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', buttonColor: 'bg-indigo-500 hover:bg-indigo-600 text-white', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-yellow-500', badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-white', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', buttonColor: 'bg-green-500 hover:bg-green-600 text-white', icon: Bell },
  served: { label: 'Served', color: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', buttonColor: 'bg-emerald-500 hover:bg-emerald-600 text-white', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-500', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', buttonColor: 'bg-gray-500 hover:bg-gray-600 text-white', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', buttonColor: 'bg-red-500 hover:bg-red-600 text-white', icon: XCircle },
}

const typeIcons: Record<string, React.ElementType> = {
  dine_in: Store,
  takeaway: User,
  delivery: Truck,
}

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served']

function formatTimeElapsed(placedAt: string | null): string {
  if (!placedAt) return ''
  const minutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000)
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function getTimerColor(placedAt: string | null): string {
  if (!placedAt) return 'text-muted-foreground'
  const minutes = Math.floor((Date.now() - new Date(placedAt).getTime()) / 60000)
  if (minutes < 10) return 'text-green-500'
  if (minutes < 20) return 'text-yellow-500'
  return 'text-red-500'
}

export default function OrdersPage() {
  const t = useTranslations('ordersPage')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<OrderStatus>>(new Set(ACTIVE_STATUSES))
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<OrderWithRelations | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [layout, setLayout] = useState<'grid' | 'kanban'>('grid')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const lastOrderCountRef = useRef(0)

  // Drag scroll for kanban view
  const kanbanRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!kanbanRef.current) return
    // Don't start drag if clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, [role="button"], [data-no-drag]')) {
      return
    }
    setIsDragging(true)
    setStartX(e.pageX - kanbanRef.current.offsetLeft)
    setScrollLeft(kanbanRef.current.scrollLeft)
    kanbanRef.current.style.cursor = 'grabbing'
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (kanbanRef.current) {
      kanbanRef.current.style.cursor = 'grab'
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !kanbanRef.current) return
    e.preventDefault()
    const x = e.pageX - kanbanRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Scroll speed multiplier
    kanbanRef.current.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      if (kanbanRef.current) {
        kanbanRef.current.style.cursor = 'grab'
      }
    }
  }, [isDragging])

  // Track if screen is mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load layout from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('orders-layout') as 'grid' | 'kanban' | null
    if (saved) {
      setLayout(saved)
    }
  }, [])

  // Persist layout to localStorage
  const handleLayoutChange = (newLayout: 'grid' | 'kanban') => {
    setLayout(newLayout)
    localStorage.setItem('orders-layout', newLayout)
  }

  const { data, isLoading, refetch } = useActiveOrders(
    selectedLocationId !== 'all' ? selectedLocationId : undefined
  )
  const updateStatus = useUpdateOrderStatus()

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })
  const locations = locationsData?.data?.locations || []

  const orders = data?.data?.orders || []

  // Play sound when new orders arrive
  useEffect(() => {
    if (soundEnabled && orders.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(() => { })
    }
    lastOrderCountRef.current = orders.length
  }, [orders.length, soundEnabled])

  // Filter orders by selected statuses
  const filteredOrders = orders.filter(o => selectedStatuses.has(o.status as OrderStatus))

  // Group orders by status for kanban view
  const ordersByStatus = ACTIVE_STATUSES.reduce((acc, status) => {
    acc[status] = filteredOrders.filter(o => o.status === status)
    return acc
  }, {} as Record<OrderStatus, OrderWithRelations[]>)

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus.mutateAsync({ id: orderId, status: newStatus })
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      draft: 'placed',
      placed: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'completed',
      completed: null,
      cancelled: null,
    }
    return flow[currentStatus]
  }

  const toggleStatus = (status: OrderStatus) => {
    const newSet = new Set(selectedStatuses)
    if (newSet.has(status)) {
      newSet.delete(status)
    } else {
      newSet.add(status)
    }
    setSelectedStatuses(newSet)
  }

  const selectAllStatuses = () => {
    setSelectedStatuses(new Set(ACTIVE_STATUSES))
  }

  const OrderCard = ({ order }: { order: OrderWithRelations }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const StatusIcon = statusConfig[order.status]?.icon || Clock
    const TypeIcon = typeIcons[order.type] || Store
    const nextStatus = getNextStatus(order.status)
    const timerColor = getTimerColor(order.placed_at)

    // Check if there's additional info to show
    const hasNotes = order.customer_notes || order.items?.some(item => item.notes)
    const hasAllergens = order.items?.some(item => (item as any).allergens?.length > 0)
    const hasOptions = order.items?.some(item => (item as any).selected_options?.length > 0)
    const hasAdditionalInfo = hasNotes || hasAllergens || hasOptions

    return (
      <Card className="relative overflow-hidden">
        {/* Status indicator bar */}
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1',
          statusConfig[order.status]?.color,
          order.status === 'ready' && 'animate-pulse',
        )} />

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base font-bold shrink-0">{order.order_number}</span>
              <Badge variant="outline" className="gap-0.5 text-xs px-1.5 shrink-0">
                <TypeIcon className="h-3 w-3" />
                {t(`type.${order.type}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={cn("font-mono text-xs", timerColor)}>
                {formatTimeElapsed(order.placed_at)}
              </span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                title={t('viewLogs')}
                onClick={() => setSelectedOrderForLogs(order)}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {order.table_id && (
              <Badge variant="secondary" className="flex items-center gap-0.5 text-xs px-1.5">
                <Table className="h-2.5 w-2.5" />
                {order.table?.zone && `${order.table.zone} - `}{order.table?.name}
              </Badge>
            )}
            {/* {order.customer_name && (
              <Badge variant="secondary" className="flex items-center gap-0.5 text-xs px-1.5">
                <User className="h-2.5 w-2.5" />
                {order.customer_name}
              </Badge>
            )} */}
            {hasAdditionalInfo && (
              <Badge variant="outline" className="flex items-center gap-0.5 text-xs px-1.5 text-amber-500 border-amber-500/50">
                <Info className="h-2.5 w-2.5" />
                {t('hasNotes')}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Order items */}
          <div className="space-y-1.5 text-sm">
            {(isExpanded ? order.items : order.items?.slice(0, 3))?.map((item) => (
              <div key={item.id} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="truncate font-medium">{item.quantity}x {item.item_name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">
                    €{item.total_price?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {/* Expanded item details */}
                {isExpanded && (
                  <div className="pl-4 space-y-0.5">
                    {/* Variant */}
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant_name}
                      </p>
                    )}

                    {/* Options */}
                    {(item as any).selected_options?.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {(item as any).selected_options.map((opt: any, i: number) => (
                          <span key={i}>
                            {opt.name}{opt.price > 0 && ` (+€${opt.price.toFixed(2)})`}
                            {i < (item as any).selected_options.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Item notes */}
                    {item.notes && (
                      <div className="flex items-start gap-1 text-xs text-amber-500">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{item.notes}</span>
                      </div>
                    )}

                    {/* Allergens */}
                    {(item as any).allergens?.length > 0 && (
                      <div className="flex items-start gap-1 text-xs text-red-500">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{(item as any).allergens.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Show more items indicator (collapsed) */}
            {!isExpanded && (order.items?.length || 0) > 3 && (
              <div className="text-muted-foreground text-xs">
                {t('moreItems', { count: (order.items?.length || 0) - 3 })}
              </div>
            )}
          </div>

          {/* Customer notes (expanded) */}
          {isExpanded && order.customer_notes && (
            <div className="p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
              <div className="flex items-start gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-500">{t('customerNotes')}</p>
                  <p className="text-muted-foreground">{order.customer_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expand/Collapse button */}
          {(hasAdditionalInfo || (order.items?.length || 0) > 3) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  {t('showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  {t('showMore')}
                </>
              )}
            </Button>
          )}

          {/* Total and status */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <span className="text-lg font-bold">
                €{order.total?.toFixed(2) || '0.00'}
              </span>
            </div>
            <Badge className={statusConfig[order.status]?.badgeColor}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {t(`status.${order.status}`)}
            </Badge>
          </div>

          {/* Action buttons */}
          {nextStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleStatusChange(order.id, nextStatus)}
                disabled={updateStatus.isPending}
              >
                {t('markAs', { status: t(`status.${nextStatus}`) })}
              </Button>
              {order.status === 'placed' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange(order.id, 'cancelled')}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 h-full">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Location selector */}
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-[120px] md:w-[180px]">
              <SelectValue placeholder={t('allLocations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allLocations')}</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sound toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? t('disableSound') : t('enableSound')}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>

          {/* Layout toggle - hidden on small screens */}
          <div className="hidden md:flex border rounded-md">
            <Button
              variant={layout === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleLayoutChange('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === 'kanban' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleLayoutChange('kanban')}
              className="rounded-l-none"
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>

          {/* Waiter Mode */}
          <Button variant="outline" asChild className="px-3 md:px-4">
            <Link href="/dashboard/waiter">
              <Smartphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('waiterMode')}</span>
            </Link>
          </Button>



          {/* Refresh */}
          <Button onClick={() => refetch()} variant="outline" disabled={isLoading} size="icon" className="shrink-0">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {/* Create Order */}
          <Button onClick={() => setIsCreateOrderOpen(true)} className="px-3 md:px-4">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{t('createOrder')}</span>
          </Button>
        </div>
      </div>

      {/* Status filter tabs (multi-select) */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        <Button
          variant={selectedStatuses.size === ACTIVE_STATUSES.length ? 'default' : 'outline'}
          onClick={selectAllStatuses}
          className="h-9 px-3 text-sm md:h-14 md:px-6 md:text-lg"
        >
          {t('all')} ({orders.length})
        </Button>
        {ACTIVE_STATUSES.map((status) => {
          const config = statusConfig[status]
          const count = statusCounts[status] || 0
          const isSelected = selectedStatuses.has(status)
          return (
            <Button
              key={status}
              variant="outline"
              onClick={() => toggleStatus(status)}
              className={cn(
                "h-9 px-3 text-sm gap-1.5 md:h-14 md:px-6 md:text-lg md:gap-3",
                isSelected && config.buttonColor
              )}
            >
              <config.icon className="h-4 w-4 md:h-6 md:w-6" />
              <span className="hidden sm:inline">{t(`status.${status}`)}</span>
              {!!count && <Badge variant="destructive" className="text-xs px-1.5 md:text-base md:px-2.5 md:py-0.5">{count}</Badge>}
            </Button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noOrdersFound')}</p>
          </CardContent>
        </Card>
      ) : layout === 'grid' || isMobile ? (
        /* Grid Layout */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        /* Kanban Layout */
        <div
          ref={kanbanRef}
          className="overflow-x-auto -mx-6 px-6 cursor-grab select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex gap-4 min-h-[calc(100vh-280px)] pb-4">
            {ACTIVE_STATUSES.filter(s => selectedStatuses.has(s)).map((status) => (
              <div key={status} className="flex-shrink-0 w-[380px] space-y-4">
                <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                  <div className={cn("h-3 w-3 rounded-full", statusConfig[status].color)} />
                  <h2 className="font-semibold">{t(`status.${status}`)}</h2>
                  <Badge variant="secondary">{ordersByStatus[status]?.length || 0}</Badge>
                </div>
                <div className="space-y-4">
                  {ordersByStatus[status]?.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  {(!ordersByStatus[status] || ordersByStatus[status].length === 0) && (
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
            ))}
          </div>
        </div>
      )}

      {/* Logs Dialog */}
      <OrderLogsDialog
        order={selectedOrderForLogs}
        open={!!selectedOrderForLogs}
        onOpenChange={() => setSelectedOrderForLogs(null)}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
      />
    </div>
  )
}
