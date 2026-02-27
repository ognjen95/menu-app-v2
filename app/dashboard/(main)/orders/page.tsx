'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { useActiveOrders } from '@/lib/hooks/use-orders'
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
  BellRing,
  RefreshCw,
  List,
  Columns,
  Volume2,
  VolumeX,
  Plus,
  Radio,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithRelations, Location } from '@/lib/types'
import { statusConfig, typeIcons, formatTimeElapsed, getTimerColor } from '@/features/orders/orders-list/components/order-card'
import { useScrollDirection } from '@/lib/hooks/use-scroll-direction'
import { OrdersListCards } from '@/features/orders/orders-list/components/orders-list-cards'
import { OrdersKanban } from '@/features/orders/orders-list/components/orders-kanban'
import { NewOrdersModal } from '@/features/orders/orders-list/components/new-orders-modal'
import { useRealtimeOrders } from '@/lib/hooks/use-realtime-orders'
import { playNotificationSound, unlockAudio, checkAudioPermission } from '@/lib/utils/notification-sound'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Store, Clock } from 'lucide-react'

type SortColumn = 'type' | 'orderNumber' | 'status' | 'items' | 'total' | 'time'
type SortDirection = 'asc' | 'desc'

// Lazy load dialogs
const OrderDetailDialog = dynamic(() => import('@/features/orders/orders-list/components/OrderDetailDialog').then(mod => ({ default: mod.OrderDetailDialog })), { ssr: false })
const CreateOrderDialog = dynamic(() => import('@/features/orders/create-order/containers/create-order-container').then(mod => ({ default: mod.CreateOrderContainer })), { ssr: false })

import { motion } from '@/components/ui/animated'
import { OrdersGridSkeleton, KanbanLayoutSkeleton } from '@/components/ui/skeletons'
import { OfflineSyncIndicator } from '@/components/ui/offline-sync-indicator'
import { useInitOfflineSync, useOfflineUpdateOrderStatus } from '@/lib/hooks/use-offline-orders'
import LiveAlert from '@/features/orders/orders-list/components/live-alert'
import { useTables } from '@/features/tables'
import { useAllMenuItems, useLocations, useMenuItems } from '@/lib/hooks'
import { useTeams } from '@/features/teams/services/use-teams'

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served']

export default function OrdersPage() {
  const t = useTranslations('ordersPage')

  // Initialize offline sync manager
  useInitOfflineSync()

  const [selectedStatuses, setSelectedStatuses] = useState<Set<OrderStatus>>(new Set(ACTIVE_STATUSES))
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderWithRelations | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [selectedTableId, setSelectedTableId] = useState<string>('all')
  const [layout, setLayout] = useState<'list' | 'kanban'>('list')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('time')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [liveEnabled, setLiveEnabled] = useState(false)
  const [uncheckedOrders, setUncheckedOrders] = useState<OrderWithRelations[]>([])
  const [showNewOrdersModal, setShowNewOrdersModal] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [liveAlertDismissed, setLiveAlertDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isScrollingDown } = useScrollDirection({ threshold: 10, enabled: isMobile })

  const lastOrderCountRef = useRef(0)
  const updateOrderStatus = useOfflineUpdateOrderStatus()

  // Track if screen is mobile

  const { data: locationsData } = useLocations()
  const locations = locationsData?.data?.locations || []

  const { data: tablesData } = useTables(selectedLocationId !== 'all' ? selectedLocationId : null)
  const availableTables = tablesData || []

  const { team } = useTeams({})
  const { data: menuItemsData } = useAllMenuItems({});
  const menuItems = menuItemsData?.data?.items ?? [];

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load layout and location from localStorage on mount (live mode intentionally NOT restored - requires user action each session)
  useEffect(() => {
    const savedLayout = localStorage.getItem('orders-layout') as 'list' | 'kanban' | null
    if (savedLayout) {
      setLayout(savedLayout)
    }

    const savedLocation = localStorage.getItem('orders-selected-location')
    if (savedLocation) {
      setSelectedLocationId(savedLocation)
    }

    // Check if audio was previously unlocked (PWA persistence)
    const wasAudioUnlocked = localStorage.getItem('orders-audio-unlocked') === 'true'
    if (wasAudioUnlocked) {
      // Verify audio permission is still valid (browser may have revoked it)
      checkAudioPermission().then(success => {
        setAudioUnlocked(success)
        if (!success) {
          // Permission was revoked, clear the cached state
          localStorage.removeItem('orders-audio-unlocked')
        }
      })
    }
  }, [])

  // Persist layout to localStorage
  const handleLayoutChange = (newLayout: 'list' | 'kanban') => {
    setLayout(newLayout)
    localStorage.setItem('orders-layout', newLayout)
  }

  // Toggle live mode and unlock audio if enabling
  const handleLiveToggle = useCallback(async () => {
    setLiveEnabled(prev => {
      const newValue = !prev
      if (newValue) {
        // Unlock audio when enabling live mode and persist for PWA
        unlockAudio().then(unlocked => {
          if (unlocked) {
            setAudioUnlocked(true)
            localStorage.setItem('orders-audio-unlocked', 'true')
          }
        })
        toast.success(t('liveEnabled') || 'Live mode enabled', {
          description: t('liveEnabledDesc') || 'Orders will update in real-time with sound alerts',
        })
      } else {
        toast.info(t('liveDisabled') || 'Live mode disabled')
      }
      return newValue
    })
  }, [t])


  // Handle viewing an order from the new orders modal
  const handleViewNewOrder = useCallback((order: OrderWithRelations) => {
    // Remove from unchecked list and check if we should close modal
    setUncheckedOrders(prev => {
      const updated = prev.filter(o => o.id !== order.id)
      // Close modal if no more unchecked orders
      if (updated.length === 0) {
        setShowNewOrdersModal(false)
      }
      return updated
    })
    // Open the order detail
    setSelectedOrderForDetail(order)
  }, [])

  // Dismiss all unchecked orders
  const handleDismissAllNewOrders = useCallback(() => {
    setUncheckedOrders([])
    setShowNewOrdersModal(false)
  }, [])

  // Realtime orders subscription
  const { status: realtimeStatus, isLive, reconnect, newOrders, clearNewOrders } = useRealtimeOrders(
    liveEnabled,
    selectedLocationId !== 'all' ? selectedLocationId : undefined
  )

  // Auto-reconnect when connection is lost (with retry limit)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const maxReconnectAttempts = 3

  useEffect(() => {
    if (!liveEnabled) {
      setReconnectAttempts(0)
      setIsReconnecting(false)
      return
    }

    // Reset attempts when successfully connected
    if (isLive) {
      setReconnectAttempts(0)
      setIsReconnecting(false)
      return
    }

    // Auto-reconnect on error or disconnected (up to max attempts)
    if ((realtimeStatus === 'error' || realtimeStatus === 'disconnected') && reconnectAttempts < maxReconnectAttempts) {
      setIsReconnecting(true)
      const timeout = setTimeout(() => {
        console.log(`[LIVE] Auto-reconnecting... (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
        setReconnectAttempts(prev => prev + 1)
        reconnect()
      }, 2000 * (reconnectAttempts + 1)) // Exponential backoff: 2s, 4s, 6s

      return () => clearTimeout(timeout)
    } else if (reconnectAttempts >= maxReconnectAttempts) {
      setIsReconnecting(false)
    }
  }, [liveEnabled, isLive, realtimeStatus, reconnect, reconnectAttempts])

  // Store new order IDs to look up after refetch (with timestamp for cleanup)
  const [pendingOrderIds, setPendingOrderIds] = useState<{ id: string; addedAt: number }[]>([])

  // ! TODO: THIS needs to be checked
  // Cleanup stale pending order IDs after 10 seconds (handles replication lag / filter mismatches)
  useEffect(() => {
    if (pendingOrderIds.length === 0) return

    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const staleThreshold = 10000 // 10 seconds
      setPendingOrderIds(prev => prev.filter(p => now - p.addedAt < staleThreshold))
    }, 2000)

    return () => clearInterval(cleanupInterval)
  }, [pendingOrderIds.length])

  // React to new orders from realtime - just store IDs and show notification
  useEffect(() => {
    if (newOrders.length > 0) {
      // Show toast and store IDs for lookup after refetch
      newOrders.forEach(order => {
        toast.success(t('newOrderReceived') || 'New order received!', {
          description: `Order #${order.order_number || order.id?.slice(0, 8)}`,
        })
        setPendingOrderIds(prev => [...prev, { id: order.id, addedAt: Date.now() }])
      })

      // Show the modal (sound loop is handled by modal)
      setShowNewOrdersModal(true)

      // Clear the processed orders
      clearNewOrders()
    }
  }, [newOrders, t, clearNewOrders])

  const { data, isLoading, refetch } = useActiveOrders(
    selectedLocationId !== 'all' ? selectedLocationId : undefined,
    // ! TODO: Check should poll be on if Live mode is on / Or based on subscription type
    { disablePolling: liveEnabled } // Disable polling when LIVE mode is on
  )

  // Reset table selection when location changes
  useEffect(() => {
    setSelectedTableId('all')
  }, [selectedLocationId])

  const orders = useMemo(() => data?.data?.orders || [], [data])

  // When orders data updates, find any pending orders and add them to unchecked
  useEffect(() => {
    if (pendingOrderIds.length > 0 && orders.length > 0) {
      const pendingIds = pendingOrderIds.map(p => p.id)
      const foundOrders = orders.filter(o => pendingIds.includes(o.id))
      if (foundOrders.length > 0) {
        setUncheckedOrders(prev => {
          const newOnes = foundOrders.filter(fo => !prev.some(p => p.id === fo.id))
          return [...newOnes, ...prev]
        })
        // Remove found IDs from pending
        setPendingOrderIds(prev => prev.filter(p => !foundOrders.some(fo => fo.id === p.id)))
      }
    }
  }, [orders, pendingOrderIds])

  // Play sound when new orders arrive (for non-live mode polling)
  useEffect(() => {
    if (!liveEnabled && soundEnabled && audioUnlocked && orders.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
      playNotificationSound()
    }
    lastOrderCountRef.current = orders.length
  }, [orders.length, soundEnabled, liveEnabled, audioUnlocked])

  // Filter orders by selected statuses and table
  const filteredOrders = orders.filter(o => {
    const matchesStatus = selectedStatuses.has(o.status as OrderStatus)
    const matchesTable = selectedTableId === 'all' || o.table_id === selectedTableId
    return matchesStatus && matchesTable
  })

  // Sort orders
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '')
          break
        case 'orderNumber':
          comparison = (a.order_number || a.id).localeCompare(b.order_number || b.id)
          break
        case 'status':
          const statusOrder = ['placed', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled']
          comparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
          break
        case 'items':
          comparison = (a.items?.length || 0) - (b.items?.length || 0)
          break
        case 'total':
          comparison = (a.total || 0) - (b.total || 0)
          break
        case 'time':
          comparison = new Date(a.placed_at || 0).getTime() - new Date(b.placed_at || 0).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredOrders, sortColumn, sortDirection])

  // Handle status update from kanban drag
  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    const result = await updateOrderStatus.mutateAsync({ orderId, status: newStatus })
    if (result.isOffline) {
      toast.info(t('statusUpdated') || 'Status updated', {
        description: 'Saved offline. Will sync when connected.',
      })
    }
  }, [updateOrderStatus, t])

  // Handle complete and cancel for served orders
  const handleCompleteOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: 'completed' })
  }, [updateOrderStatus])

  const handleCancelOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: 'cancelled' })
  }, [updateOrderStatus])

  // Handle accept order (from modal - moves from placed to accepted)
  const handleAcceptOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: 'accepted' })
    // Remove from unchecked orders
    setUncheckedOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId)
      if (updated.length === 0) {
        setShowNewOrdersModal(false)
      }
      return updated
    })
  }, [updateOrderStatus])

  // Handle cancel order from modal
  const handleCancelOrderFromModal = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ orderId, status: 'cancelled' })
    // Remove from unchecked orders
    setUncheckedOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId)
      if (updated.length === 0) {
        setShowNewOrdersModal(false)
      }
      return updated
    })
  }, [updateOrderStatus])

  // State for accepting all orders
  const [isAcceptingAll, setIsAcceptingAll] = useState(false)

  // Handle accept all orders from modal
  const handleAcceptAllOrders = useCallback(async () => {
    if (uncheckedOrders.length === 0) return

    setIsAcceptingAll(true)
    const results: { id: string; success: boolean }[] = []

    // Process all orders, don't stop on failure
    for (const order of uncheckedOrders) {
      try {
        await updateOrderStatus.mutateAsync({ orderId: order.id, status: 'accepted' })
        results.push({ id: order.id, success: true })
      } catch (error) {
        console.error(`[LIVE] Failed to accept order ${order.id}:`, error)
        results.push({ id: order.id, success: false })
        toast.error(t('acceptFailed') || 'Failed to accept order', {
          description: `Order #${order.order_number || order.id.slice(0, 8)}`,
        })
      }
    }

    // Remove successfully accepted orders from unchecked
    const successfulIds = results.filter(r => r.success).map(r => r.id)
    setUncheckedOrders(prev => {
      const updated = prev.filter(o => !successfulIds.includes(o.id))
      if (updated.length === 0) {
        setShowNewOrdersModal(false)
      }
      return updated
    })

    // Show success message for accepted orders
    const successCount = successfulIds.length
    const failCount = results.length - successCount
    if (successCount > 0) {
      toast.success(t('ordersAccepted') || 'Orders accepted', {
        description: `${successCount} ${successCount === 1 ? 'order' : 'orders'} accepted${failCount > 0 ? `, ${failCount} failed` : ''}`,
      })
    }

    setIsAcceptingAll(false)
  }, [uncheckedOrders, updateOrderStatus, t])

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
    if (selectedStatuses.size === ACTIVE_STATUSES.length) {
      setSelectedStatuses(new Set())
    } else {
      setSelectedStatuses(new Set(ACTIVE_STATUSES))
    }
  }


  return (
    <div className="h-full">
      {/* Live connection status alert - only render after mount to prevent hydration mismatch */}
      {mounted && !liveAlertDismissed && !(liveEnabled && isLive) && (
        <div className='md:pb-3'>
          <LiveAlert
            liveEnabled={liveEnabled}
            isLive={isLive}
            isReconnecting={isReconnecting}
            realtimeStatus={realtimeStatus}
            t={t}
            reconnectAttempts={reconnectAttempts}
            maxReconnectAttempts={maxReconnectAttempts}
            setReconnectAttempts={setReconnectAttempts}
            reconnect={reconnect}
            handleLiveToggle={handleLiveToggle}
            setLiveAlertDismissed={setLiveAlertDismissed}
            audioUnlocked={audioUnlocked}
            soundEnabled={soundEnabled}
          />
        </div>
      )}

      {/* Page header */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4 w-full pb-5 md:pb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground"> {t('description')}</p>

        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-1">
          {/* Location selector */}
          <Select value={selectedLocationId} onValueChange={(value) => {
            setSelectedLocationId(value)
            localStorage.setItem('orders-selected-location', value)
          }}>
            <SelectTrigger className="md:w-[120px] md:w-[180px] text-xs md:text-sm">
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

          {/* Table selector */}
          {availableTables.length > 0 && (
            <Select value={selectedTableId} onValueChange={setSelectedTableId}>
              <SelectTrigger className="md:w-[100px] md:w-[160px] text-xs md:text-sm">
                <SelectValue placeholder={t('allTables')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTables')}</SelectItem>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}{table.zone ? ` (${table.zone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <TooltipProvider>
            {/* Sound toggle - only show if audio is unlocked */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={(!audioUnlocked || !soundEnabled) ? "outline" : 'default'}
                  size="icon"
                  className={cn('hidden md:flex', {
                    'border-yellow-600 hover:bg-yellow-600/20': !audioUnlocked || !soundEnabled,
                  })}
                  onClick={() => {
                    const newValue = !soundEnabled || !audioUnlocked
                    setSoundEnabled(newValue)
                    if (newValue) {
                      unlockAudio().then(() => {
                        setAudioUnlocked(true);
                        playNotificationSound()
                      })

                      toast.success(t('soundEnabled') || 'Sound enabled')
                    } else {
                      toast.info(t('soundDisabled') || 'Sound disabled')
                    }
                  }}
                >
                  {soundEnabled && audioUnlocked ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-yellow-600" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {soundEnabled && audioUnlocked ? t('disableSound') : t('enableSound')}
              </TooltipContent>
            </Tooltip>

            {/* Live mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={liveEnabled ? 'default' : 'outline'}
                  size="icon"
                  onClick={handleLiveToggle}
                  className={cn(
                    "hidden md:flex",
                    {
                      'bg-green-600 hover:bg-green-700': liveEnabled && isLive,
                      'bg-yellow-600 hover:bg-yellow-700': liveEnabled && !isLive && realtimeStatus === 'connecting',
                      'bg-red-600 hover:bg-red-700': liveEnabled && !isLive && realtimeStatus === 'error',
                      "border border-yellow-600 hover:bg-yellow-600/20": !liveEnabled,
                    }
                  )}
                >
                  {liveEnabled ? (
                    isLive ? (
                      <Wifi className="h-4 w-4" />
                    ) : realtimeStatus === 'connecting' ? (
                      <Radio className="h-4 w-4 animate-pulse" />
                    ) : (
                      <WifiOff className="h-4 w-4" />
                    )
                  ) : (
                    <Radio className="h-4 w-4 text-yellow-600" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {liveEnabled
                  ? isLive
                    ? t('liveConnected') || 'Connected - Real-time updates active'
                    : realtimeStatus === 'connecting'
                      ? t('liveConnecting') || 'Connecting...'
                      : t('liveError') || 'Connection error - Click to retry'
                  : t('liveOff') || 'Enable real-time updates'
                }
              </TooltipContent>
            </Tooltip>

            {/* Layout toggle - hidden on small screens */}
            <div className="hidden md:flex border rounded-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={layout === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => handleLayoutChange('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('listView')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={layout === 'kanban' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => handleLayoutChange('kanban')}
                    className="rounded-l-none"
                  >
                    <Columns className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('kanbanView')}</TooltipContent>
              </Tooltip>
            </div>

            {/* Waiter Mode */}
            {/* <Button variant="outline" asChild className="px-3 md:px-4">
            <Link href="/dashboard/waiter">
              <Smartphone className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">{t('waiterMode')}</span>
            </Link>
          </Button> */}


            {/* Refresh */}
            <div className='hidden'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => refetch()} variant="ghost" disabled={isLoading} size="icon" className="shrink-0">
                      <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>{t('refresh')}</TooltipContent>
              </Tooltip>
            </div>

            {/* Create Order */}

            <Button size={'lg'} className='hidden md:block' onClick={() => setIsCreateOrderOpen(true)}>
              <div className='flex items-center w-full'>
                <Plus className="h-4 w-4 mr-3" />
                {t('createOrder')}
              </div>
            </Button>
          </TooltipProvider>
        </div>
      </motion.div>

      <div 
        className='md:hidden fixed right-4 z-10 transition-[bottom] duration-300 ease-in-out'
        style={{ bottom: isScrollingDown ? '1rem' : '100px' }}
      >
        <Button 
          className='transition-all duration-300 shadow-lg' 
          onClick={() => setIsCreateOrderOpen(true)}
          size={isScrollingDown ? 'icon' : 'default'}
        >
          <Plus className={cn(
            "h-5 w-5 transition-all duration-300",
            !isScrollingDown && "mr-2"
          )} />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isScrollingDown ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            {t('createOrder')}
          </span>
        </Button>
      </div>

      {/* Status filter tabs (multi-select) */}
      <div className="flex flex-wrap gap-2 md:gap-3 pb-3 items-center justify-between md:justify-start">
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

      <div className='pt-5'>
        {/* Content */}
        {isLoading ? (
          layout === 'list' || isMobile ? (
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
        ) : layout === 'list' || isMobile ? (
          /* List Layout - Responsive Cards */
          <OrdersListCards
            orders={sortedOrders}
            onSelectOrder={setSelectedOrderForDetail}
          />
        ) : (
          /* Kanban Layout */
          <OrdersKanban
            orders={filteredOrders}
            selectedStatuses={selectedStatuses}
            onSelectOrder={setSelectedOrderForDetail}
            onUpdateStatus={handleUpdateStatus}
            onCompleteOrder={handleCompleteOrder}
            onCancelOrder={handleCancelOrder}
          />
        )}
      </div>

      {/* New Orders Modal (Live only) */}
      <NewOrdersModal
        open={showNewOrdersModal}
        onOpenChange={setShowNewOrdersModal}
        orders={uncheckedOrders}
        onViewOrder={handleViewNewOrder}
        onDismissAll={handleDismissAllNewOrders}
        onAcceptOrder={handleAcceptOrder}
        onAcceptAllOrders={handleAcceptAllOrders}
        onCancelOrder={handleCancelOrderFromModal}
        pendingCount={pendingOrderIds.length}
        isAcceptingAll={isAcceptingAll}
      />

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrderForDetail}
        open={!!selectedOrderForDetail}
        onOpenChange={() => setSelectedOrderForDetail(null)}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderOpen}
        locations={locations}
        tables={availableTables}
        team={team}
        menuItems={menuItems}
        onOpenChange={setIsCreateOrderOpen}
      />

      {/* Offline Sync Indicator */}
      <OfflineSyncIndicator />
    </div>
  )
}
