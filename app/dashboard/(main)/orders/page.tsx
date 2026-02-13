'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { useActiveOrders } from '@/lib/hooks/use-orders'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  RefreshCw,
  LayoutGrid,
  Columns,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithRelations, Location } from '@/lib/types'
import { OrderCard, statusConfig } from '@/components/features/orders/components/order-card'

// Lazy load dialogs
const OrderDetailDialog = dynamic(() => import('@/components/features/orders/OrderDetailDialog').then(mod => ({ default: mod.OrderDetailDialog })), { ssr: false })
const CreateOrderDialog = dynamic(() => import('@/components/features/orders/create-order-dialog').then(mod => ({ default: mod.CreateOrderDialog })), { ssr: false })

import { motion, staggerContainer, staggerItemScale } from '@/components/ui/animated'
import { OrdersGridSkeleton, KanbanLayoutSkeleton } from '@/components/ui/skeletons'

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served']

export default function OrdersPage() {
  const t = useTranslations('ordersPage')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<OrderStatus>>(new Set(ACTIVE_STATUSES))
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderWithRelations | null>(null)
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
    // Don't start drag if clicking on interactive elements or cards
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, [role="button"], [data-no-drag], [data-radix-collection-item], .cursor-pointer')) {
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
  // const updateStatus = useUpdateOrderStatus()

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })
  const locations = locationsData?.data?.locations || []

  const orders = useMemo(() => data?.data?.orders || [], [data])

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

  const statusCounts = useMemo(() => orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>), [orders])

  // const handleStatusChange = useCallback(async (orderId: string, newStatus: OrderStatus) => {
  //   await updateStatus.mutateAsync({ id: orderId, status: newStatus })
  // }, [updateStatus])

  // const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
  //   const flow: Record<OrderStatus, OrderStatus | null> = {
  //     draft: 'placed',
  //     placed: 'accepted',
  //     accepted: 'preparing',
  //     preparing: 'ready',
  //     ready: 'served',
  //     served: 'completed',
  //     completed: null,
  //     cancelled: null,
  //   }
  //   return flow[currentStatus]
  // }

  const toggleStatus = useCallback((status: OrderStatus) => {
    const newSet = new Set(selectedStatuses)
    if (newSet.has(status)) {
      newSet.delete(status)
    } else {
      newSet.add(status)
    }
    setSelectedStatuses(newSet)
  }, [selectedStatuses])

  const selectAllStatuses = () => {
    setSelectedStatuses(new Set(ACTIVE_STATUSES))
  }

  return (
    <div className="space-y-6 h-full">
      {/* Page header */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Location selector */}
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-[180px] md:w-[180px]">
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
          {/* <Button variant="outline" asChild className="px-3 md:px-4">
            <Link href="/dashboard/waiter">
              <Smartphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('waiterMode')}</span>
            </Link>
          </Button> */}


          {/* Refresh */}
          <motion.div whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => refetch()} variant="outline" disabled={isLoading} size="icon" className="shrink-0">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </motion.div>
          {/* Create Order */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => setIsCreateOrderOpen(true)} className="px-3 md:px-4">
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('createOrder')}</span>
            </Button>
          </motion.div>
        </div>
      </motion.div>

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
                "h-9 px-3 text-sm gap-1.5 md:h-14 md:px-6 md:text-lg md:gap-3 relative",
                isSelected && config.buttonColor
              )}
            >
              <config.icon className="h-4 w-4 md:h-6 md:w-6 " />
              <span className="hidden sm:inline">{t(`status.${status}`)}</span>
              {!!count && <Badge variant="destructive" className="text-xs px-1.5 md:text-base md:px-2.5 md:py-0.5 absolute -top-2 -right-2">{count}</Badge>}
            </Button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        layout === 'grid' || isMobile ? (
          <OrdersGridSkeleton count={8} />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <KanbanLayoutSkeleton columns={selectedStatuses.size || 4} />
          </div>
        )
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noOrdersFound')}</p>
          </CardContent>
        </Card>
      ) : layout === 'grid' || isMobile ? (
        /* Grid Layout */
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          {filteredOrders.map((order, index) => (
            <motion.div key={order.id} variants={staggerItemScale} custom={index}>
              <OrderCard order={order} onSelect={setSelectedOrderForDetail} />
            </motion.div>
          ))}
        </motion.div>
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
          <motion.div
            className="flex gap-4 min-h-[calc(100vh-280px)] pb-4"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {ACTIVE_STATUSES.filter(s => selectedStatuses.has(s)).map((status, colIndex) => (
              <motion.div
                key={status}
                className="flex-shrink-0 w-[380px] space-y-4"
                variants={staggerItemScale}
                custom={colIndex}
              >
                <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                  <div className={cn("h-3 w-3 rounded-full", statusConfig[status].color)} />
                  <h2 className="font-semibold">{t(`status.${status}`)}</h2>
                  <Badge variant="secondary">{ordersByStatus[status]?.length || 0}</Badge>
                </div>
                <motion.div
                  className="space-y-4"
                  initial="initial"
                  animate="animate"
                  variants={staggerContainer}
                >
                  {ordersByStatus[status]?.map((order, orderIndex) => (
                    <motion.div key={order.id} variants={staggerItemScale} custom={orderIndex}>
                      <OrderCard order={order} onSelect={setSelectedOrderForDetail} />
                    </motion.div>
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
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}


      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrderForDetail}
        open={!!selectedOrderForDetail}
        onOpenChange={() => setSelectedOrderForDetail(null)}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderOpen}
        onOpenChange={setIsCreateOrderOpen}
      />
    </div>
  )
}
