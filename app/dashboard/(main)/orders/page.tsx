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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

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
import { OrderCard, statusConfig, typeIcons, formatTimeElapsed, getTimerColor } from '@/components/features/orders/components/order-card'
import { OrdersKanban } from '@/components/features/orders/components/orders-kanban'
import { NewOrdersModal } from '@/components/features/orders/components/new-orders-modal'
import { useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { useRealtimeOrders } from '@/lib/hooks/use-realtime-orders'
import { playNotificationSound, unlockAudio } from '@/lib/utils/notification-sound'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Store, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortColumn = 'type' | 'orderNumber' | 'status' | 'items' | 'total' | 'time'
type SortDirection = 'asc' | 'desc'

// Lazy load dialogs
const OrderDetailDialog = dynamic(() => import('@/components/features/orders/OrderDetailDialog').then(mod => ({ default: mod.OrderDetailDialog })), { ssr: false })
const CreateOrderDialog = dynamic(() => import('@/components/features/orders/create-order-dialog').then(mod => ({ default: mod.CreateOrderDialog })), { ssr: false })

import { motion } from '@/components/ui/animated'
import { OrdersGridSkeleton, KanbanLayoutSkeleton } from '@/components/ui/skeletons'

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served']

export default function OrdersPage() {
  const t = useTranslations('ordersPage')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<OrderStatus>>(new Set(ACTIVE_STATUSES))
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<OrderWithRelations | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [layout, setLayout] = useState<'list' | 'kanban'>('list')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('time')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [liveEnabled, setLiveEnabled] = useState(false)
  const [uncheckedOrders, setUncheckedOrders] = useState<OrderWithRelations[]>([])
  const [showNewOrdersModal, setShowNewOrdersModal] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [soundAlertDismissed, setSoundAlertDismissed] = useState(false)
  const [liveAlertDismissed, setLiveAlertDismissed] = useState(false)
  const lastOrderCountRef = useRef(0)
  const updateOrderStatus = useUpdateOrderStatus()

  // Track if screen is mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load layout and live mode from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('orders-layout') as 'list' | 'kanban' | null
    if (savedLayout) {
      setLayout(savedLayout)
    }
    const savedLive = localStorage.getItem('orders-live-mode')
    if (savedLive === 'true') {
      setLiveEnabled(true)
    }
  }, [])

  // Handle enabling sound notifications
  const handleEnableSound = useCallback(async () => {
    const unlocked = await unlockAudio()
    if (unlocked) {
      setAudioUnlocked(true)
      toast.success(t('soundActivated') || 'Sound notifications enabled', {
        description: t('soundActivatedDesc') || 'You will hear alerts for new orders'
      })
    } else {
      toast.error(t('soundFailed') || 'Failed to enable sound')
    }
  }, [t])

  // Persist layout to localStorage
  const handleLayoutChange = (newLayout: 'list' | 'kanban') => {
    setLayout(newLayout)
    localStorage.setItem('orders-layout', newLayout)
  }

  // Toggle live mode
  const handleLiveToggle = useCallback(() => {
    setLiveEnabled(prev => {
      const newValue = !prev
      localStorage.setItem('orders-live-mode', String(newValue))
      if (newValue) {
        toast.success(t('liveEnabled') || 'Live mode enabled', {
          description: t('liveEnabledDesc') || 'Orders will update in real-time',
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

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })
  const locations = locationsData?.data?.locations || []

  const orders = useMemo(() => data?.data?.orders || [], [data])

  // When orders data updates, find any pending orders and add them to unchecked
  useEffect(() => {
    if (pendingOrderIds.length > 0 && orders.length > 0) {
      const pendingIds = pendingOrderIds.map(p => p.id)
      const foundOrders = orders.filter(o => pendingIds.includes(o.id))
      if (foundOrders.length > 0) {
        console.log('[LIVE] Found full orders in refetched data:', foundOrders)
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

  // Filter orders by selected statuses
  const filteredOrders = orders.filter(o => selectedStatuses.has(o.status as OrderStatus))

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

  const handleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />
  }

  // Handle status update from kanban drag
  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus): Promise<void> => {
    await updateOrderStatus.mutateAsync({ id: orderId, status: newStatus })
  }, [updateOrderStatus])

  // Handle complete and cancel for served orders
  const handleCompleteOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ id: orderId, status: 'completed' })
  }, [updateOrderStatus])

  const handleCancelOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ id: orderId, status: 'cancelled' })
  }, [updateOrderStatus])

  // Handle accept order (from modal - moves from placed to accepted)
  const handleAcceptOrder = useCallback((orderId: string) => {
    updateOrderStatus.mutate({ id: orderId, status: 'accepted' })
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
    updateOrderStatus.mutate({ id: orderId, status: 'cancelled' })
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
        await updateOrderStatus.mutateAsync({ id: order.id, status: 'accepted' })
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
    setSelectedStatuses(new Set(ACTIVE_STATUSES))
  }

  return (
    <div className="space-y-6 h-full">
      {/* Sound activation alert - show when audio not unlocked OR sound is disabled */}
      {!soundAlertDismissed && (!audioUnlocked || !soundEnabled) && (
        <Alert variant="warning" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="h-5 w-5 animate-pulse" />
            <div>
              <AlertTitle>
                {!audioUnlocked 
                  ? t('enableSoundNotifications') || 'Enable Sound Notifications'
                  : t('soundDisabledTitle') || 'Sound Notifications Disabled'
                }
              </AlertTitle>
              <AlertDescription>
                {!audioUnlocked
                  ? t('enableSoundDesc') || 'Get audio alerts when new orders arrive in real-time'
                  : t('soundDisabledDesc') || 'You will not hear alerts for new orders'
                }
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {!audioUnlocked ? (
              <Button onClick={handleEnableSound} className="gap-2 shrink-0">
                <Volume2 className="h-4 w-4" />
                {t('enableSound') || 'Enable Sound'}
              </Button>
            ) : (
              <Button onClick={() => setSoundEnabled(true)} className="gap-2 shrink-0">
                <Volume2 className="h-4 w-4" />
                {t('turnOnSound') || 'Turn On'}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSoundAlertDismissed(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Live connection status alert */}
      {!liveAlertDismissed && (
        <Alert 
          variant={
            !liveEnabled ? 'muted' 
            : isLive ? 'success' 
            : (realtimeStatus === 'connecting' || isReconnecting) ? 'warning' 
            : realtimeStatus === 'error' ? 'destructive' 
            : 'muted'
          }
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            {!liveEnabled ? (
              <Radio className="h-5 w-5" />
            ) : isLive ? (
              <Wifi className="h-5 w-5" />
            ) : (realtimeStatus === 'connecting' || isReconnecting) ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : realtimeStatus === 'error' ? (
              <WifiOff className="h-5 w-5" />
            ) : (
              <Radio className="h-5 w-5" />
            )}
            <div>
              <AlertTitle>
                {!liveEnabled
                  ? t('liveOff') || 'Real-time updates disabled'
                  : isLive 
                    ? t('liveConnected') || 'Connected - Real-time updates active'
                    : isReconnecting
                    ? `${t('reconnecting') || 'Reconnecting'}... (${reconnectAttempts}/${maxReconnectAttempts})`
                    : realtimeStatus === 'connecting'
                    ? t('liveConnecting') || 'Connecting...'
                    : realtimeStatus === 'error' && reconnectAttempts >= maxReconnectAttempts
                    ? t('liveErrorMaxRetries') || 'Connection failed - Manual retry required'
                    : realtimeStatus === 'error'
                    ? t('liveError') || 'Connection error'
                    : t('liveDisconnected') || 'Disconnected'
                }
              </AlertTitle>
              {liveEnabled && (!audioUnlocked || !soundEnabled) && isLive && (
                <AlertDescription>
                  {t('noSoundWarning') || 'Sound notifications are not enabled'}
                </AlertDescription>
              )}
              {isReconnecting && (
                <AlertDescription>
                  {t('autoReconnecting') || 'Attempting to reconnect automatically...'}
                </AlertDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {liveEnabled && realtimeStatus === 'error' && !isReconnecting && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setReconnectAttempts(0)
                  reconnect()
                }} 
                className="gap-1.5"
              >
                <RefreshCw className="h-3 w-3" />
                {t('retry') || 'Retry'}
              </Button>
            )}
            {!liveEnabled && (
              <Button variant="outline" size="sm" onClick={handleLiveToggle} className="gap-1.5">
                <Radio className="h-3 w-3" />
                {t('enableLive') || 'Enable'}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLiveAlertDismissed(true)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

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

          {/* Sound toggle - only show if audio is unlocked */}
          {audioUnlocked && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newValue = !soundEnabled
                setSoundEnabled(newValue)
                if (newValue) {
                  playNotificationSound()
                  toast.success(t('soundEnabled') || 'Sound enabled')
                } else {
                  toast.info(t('soundDisabled') || 'Sound disabled')
                }
              }}
              title={soundEnabled ? t('disableSound') : t('enableSound')}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          )}

          {/* Live mode toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={liveEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLiveToggle}
                  className={cn(
                    "gap-1.5 px-3",
                    liveEnabled && isLive && "bg-green-600 hover:bg-green-700",
                    liveEnabled && !isLive && realtimeStatus === 'connecting' && "bg-yellow-600 hover:bg-yellow-700",
                    liveEnabled && !isLive && realtimeStatus === 'error' && "bg-red-600 hover:bg-red-700"
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
                    <Radio className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">LIVE</span>
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
          </TooltipProvider>

          {/* Layout toggle - hidden on small screens */}
          <div className="hidden md:flex border rounded-full">
            <Button
              variant={layout === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleLayoutChange('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
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
        /* List/Table Layout */
        <Card>
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('type')}>
                    <div className="flex items-center">{t('typeColumn')}<SortIcon column="type" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('orderNumber')}>
                    <div className="flex items-center">{t('orderNumber')}<SortIcon column="orderNumber" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                    <div className="flex items-center">{t('statusColumn')}<SortIcon column="status" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('items')}>
                    <div className="flex items-center">{t('items')}<SortIcon column="items" /></div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end">{t('total')}<SortIcon column="total" /></div>
                  </TableHead>
                  <TableHead className="w-20 cursor-pointer hover:bg-muted/50" onClick={() => handleSort('time')}>
                    <div className="flex items-center">{t('time')}<SortIcon column="time" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => {
                  const TypeIcon = typeIcons[order.type] || Store
                  const StatusIcon = statusConfig[order.status]?.icon || Clock
                  const config = statusConfig[order.status]
                  const timerColor = getTimerColor(order.placed_at)
                  const itemsList = order.items?.map(item => `${item.quantity}× ${item.menu_item?.name || 'Item'}`).join(', ') || ''
                  const itemsShort = itemsList.length > 40 ? itemsList.slice(0, 40) + '...' : itemsList

                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedOrderForDetail(order)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center rounded-full h-12 w-12 bg-secondary">
                          <TypeIcon className="h-5 w-5 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        #{order.order_number || order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('gap-1', config?.badgeColor)}>
                          <StatusIcon className="h-3 w-3" />
                          {t(`status.${order.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {itemsList.length > 40 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">{itemsShort}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-sm">{itemsList}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span>{itemsList || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{order.total?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-sm font-medium', timerColor)}>
                          {formatTimeElapsed(order.placed_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </Card>
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
        onOpenChange={setIsCreateOrderOpen}
      />
    </div>
  )
}
