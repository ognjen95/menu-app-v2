'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { OrderLogsDialog } from '@/components/features/orders/OrderLogsDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Bell,
  RefreshCw,
  Timer,
  UtensilsCrossed,
  Loader2,
  Volume2,
  VolumeX,
  MoreVertical,
  History,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Order, OrderItem, Location, OrderWithRelations } from '@/lib/types'

type OrderWithItems = Order & {
  items: (OrderItem & { menu_item?: { name: string; image_urls?: string[] } })[]
  table?: { id: string; name: string; zone?: string }
  location?: { id: string; name: string }
}

type KitchenOrder = {
  id: string
  order_number: string
  type: string
  status: string
  table_name?: string
  table_zone?: string
  location_name: string
  customer_name?: string
  items: {
    id: string
    name: string
    quantity: number
    notes?: string
    status: string
    options: { name: string; price: number }[]
  }[]
  placed_at: string
  accepted_at?: string | null
  preparing_at?: string | null
  ready_at?: string | null
  served_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  time_elapsed: number
  // User IDs for fetching profiles
  status_updated_by?: string | null
  accepted_by?: string | null
  prepared_by?: string | null
  served_by?: string | null
  cancelled_by?: string | null
}

const STATUS_CONFIG = {
  placed: { label: 'New', color: 'bg-blue-500', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-yellow-500', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', icon: CheckCircle2 },
}

function formatTimeElapsed(minutes: number, justNowText: string): string {
  if (minutes < 1) return justNowText
  if (minutes < 60) return `${Math.floor(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  return `${hours}h ${mins}m`
}

function getTimerColor(minutes: number): string {
  if (minutes < 10) return 'text-green-500'
  if (minutes < 20) return 'text-yellow-500'
  return 'text-red-500'
}

export default function KitchenPage() {
  const t = useTranslations('kitchenPage')
  const queryClient = useQueryClient()
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [selectedOrderForLogs, setSelectedOrderForLogs] = useState<KitchenOrder | null>(null)

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })
  const locations = locationsData?.data?.locations || []

  // Auto-select first location
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  // Fetch active orders
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['kitchen-orders', selectedLocationId],
    queryFn: () => apiGet<{ data: { orders: OrderWithItems[] } }>('/orders/active', 
      selectedLocationId ? { location_id: selectedLocationId } : undefined
    ),
    enabled: true,
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })

  const orders = ordersData?.data?.orders || []

  // Play sound when new orders arrive
  useEffect(() => {
    if (soundEnabled && orders.length > lastOrderCount && lastOrderCount > 0) {
      // Play notification sound
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(() => {}) // Ignore errors if sound can't play
    }
    setLastOrderCount(orders.length)
  }, [orders.length, lastOrderCount, soundEnabled])

  // Transform orders for display
  const kitchenOrders: KitchenOrder[] = orders.map(order => ({
    id: order.id,
    order_number: order.order_number || order.id.slice(-6).toUpperCase(),
    type: order.type,
    status: order.status,
    table_name: order.table?.name,
    table_zone: order.table?.zone || undefined,
    location_name: order.location?.name || '',
    customer_name: order.customer_name || undefined,
    items: order.items?.map(item => ({
      id: item.id,
      name: item.item_name,
      quantity: item.quantity,
      notes: item.notes || undefined,
      status: item.status,
      options: item.selected_options || [],
    })) || [],
    placed_at: order.placed_at || order.created_at,
    accepted_at: order.accepted_at,
    preparing_at: order.preparing_at,
    ready_at: order.ready_at,
    served_at: order.served_at,
    completed_at: order.completed_at,
    cancelled_at: order.cancelled_at,
    cancellation_reason: order.cancellation_reason,
    time_elapsed: order.placed_at 
      ? (Date.now() - new Date(order.placed_at).getTime()) / 60000 
      : 0,
    status_updated_by: order.status_updated_by,
    accepted_by: order.accepted_by,
    prepared_by: order.prepared_by,
    served_by: order.served_by,
    cancelled_by: order.cancelled_by,
  }))

  // Group orders by status
  const ordersByStatus = {
    placed: kitchenOrders.filter(o => o.status === 'placed'),
    accepted: kitchenOrders.filter(o => o.status === 'accepted'),
    preparing: kitchenOrders.filter(o => o.status === 'preparing'),
    ready: kitchenOrders.filter(o => o.status === 'ready'),
  }

  // Update order status mutation
  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiPatch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    },
  })

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatus.mutate({ orderId, status: newStatus })
  }

  const getNextStatus = (currentStatus: string): string | null => {
    const flow = ['placed', 'accepted', 'preparing', 'ready', 'served']
    const currentIndex = flow.indexOf(currentStatus)
    return currentIndex < flow.length - 1 ? flow[currentIndex + 1] : null
  }

  return (
      <div className="h-full flex flex-col">
        {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            <h1 className="text-xl font-bold">{t('title')}</h1>
          </div>
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('allLocations')} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? t('disableSound') : t('enableSound')}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Order columns */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-full">
          {/* New Orders */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
              <div className={cn("h-3 w-3 rounded-full", STATUS_CONFIG.placed.color)} />
              <h2 className="font-semibold">{t('columns.newOrders')}</h2>
              <Badge variant="secondary">{ordersByStatus.placed.length}</Badge>
            </div>
            {ordersByStatus.placed.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="accepted"
                isUpdating={updateStatus.isPending}
                t={t}
                onViewLogs={setSelectedOrderForLogs}
              />
            ))}
            {ordersByStatus.placed.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty.noNewOrders')}</p>
              </div>
            )}
          </div>

          {/* Accepted */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
              <div className={cn("h-3 w-3 rounded-full", STATUS_CONFIG.accepted.color)} />
              <h2 className="font-semibold">{t('columns.accepted')}</h2>
              <Badge variant="secondary">{ordersByStatus.accepted.length}</Badge>
            </div>
            {ordersByStatus.accepted.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="preparing"
                isUpdating={updateStatus.isPending}
                t={t}
                onViewLogs={setSelectedOrderForLogs}
              />
            ))}
            {ordersByStatus.accepted.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty.noAcceptedOrders')}</p>
              </div>
            )}
          </div>

          {/* Preparing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
              <div className={cn("h-3 w-3 rounded-full", STATUS_CONFIG.preparing.color)} />
              <h2 className="font-semibold">{t('columns.preparing')}</h2>
              <Badge variant="secondary">{ordersByStatus.preparing.length}</Badge>
            </div>
            {ordersByStatus.preparing.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="ready"
                isUpdating={updateStatus.isPending}
                t={t}
                onViewLogs={setSelectedOrderForLogs}
              />
            ))}
            {ordersByStatus.preparing.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty.nothingCooking')}</p>
              </div>
            )}
          </div>

          {/* Ready */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
              <div className={cn("h-3 w-3 rounded-full", STATUS_CONFIG.ready.color)} />
              <h2 className="font-semibold">{t('columns.readyToServe')}</h2>
              <Badge variant="secondary">{ordersByStatus.ready.length}</Badge>
            </div>
            {ordersByStatus.ready.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                nextStatus="served"
                isUpdating={updateStatus.isPending}
                t={t}
                onViewLogs={setSelectedOrderForLogs}
              />
            ))}
            {ordersByStatus.ready.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('empty.noOrdersReady')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs Dialog */}
      <OrderLogsDialog
        order={selectedOrderForLogs}
        open={!!selectedOrderForLogs}
        onOpenChange={() => setSelectedOrderForLogs(null)}
      />
      </div>
  )
}

interface OrderCardProps {
  order: KitchenOrder
  onStatusChange: (orderId: string, status: string) => void
  nextStatus: string
  isUpdating: boolean
  t: (key: string) => string
  onViewLogs: (order: KitchenOrder) => void
}

function OrderCard({ order, onStatusChange, nextStatus, isUpdating, t, onViewLogs }: OrderCardProps) {
  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
  const timerColor = getTimerColor(order.time_elapsed)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg">#{order.order_number}</span>
            {order.table_name && (
              <Badge variant="outline">
                {order.table_zone && `${order.table_zone} - `}
                {order.table_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1 font-mono text-sm", timerColor)}>
              <Timer className="h-4 w-4" />
              {formatTimeElapsed(order.time_elapsed, t('justNow'))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewLogs(order)}>
                  <History className="h-4 w-4 mr-2" />
                  View Logs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {t(`type.${order.type}`)}
          </Badge>
          {order.customer_name && <span>{order.customer_name}</span>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg"
            >
              <span className="font-bold text-primary min-w-[24px]">{item.quantity}x</span>
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                {item.options.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    + {item.options.map(o => o.name).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => onStatusChange(order.id, nextStatus)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <>
              {nextStatus === 'accepted' && t('actions.acceptOrder')}
              {nextStatus === 'preparing' && t('actions.startPreparing')}
              {nextStatus === 'ready' && t('actions.markReady')}
              {nextStatus === 'served' && t('actions.markServed')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
