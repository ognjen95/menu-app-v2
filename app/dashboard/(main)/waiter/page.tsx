'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { useCreateOrder, useActiveOrders, useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  MapPin,
  UtensilsCrossed,
  X,
  Store,
  Package,
  Truck,
  ChevronLeft,
  Check,
  Clock,
  ChefHat,
  Bell,
  Settings,
  Home,
  ClipboardList,
  Grid3X3,
  MoreVertical,
  Pencil,
  XCircle,
  Eye,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import type { Location, Table, MenuItem, OrderWithRelations, OrderStatus } from '@/lib/types'

const LOCATION_STORAGE_KEY = 'waiter-selected-location'

type CartItem = {
  id: string
  menuItem: MenuItem & { category?: { id: string; name: string } }
  quantity: number
  notes?: string
}

type OrderType = 'dine_in' | 'takeaway' | 'delivery'
type TabView = 'tables' | 'orders' | 'menu'

const statusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-500',
  placed: 'bg-blue-500',
  accepted: 'bg-indigo-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  served: 'bg-emerald-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-500',
}

export default function WaiterPage() {
  const t = useTranslations('waiterPage')
  const tCreate = useTranslations('createOrder')
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabView>('tables')
  
  // Location & Table state
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  
  // Order creation state
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (saved) {
      setSelectedLocationId(saved)
    }
  }, [])

  // Save location to localStorage
  useEffect(() => {
    if (selectedLocationId) {
      localStorage.setItem(LOCATION_STORAGE_KEY, selectedLocationId)
    }
  }, [selectedLocationId])

  // Lock body scroll when menu view, cart, or location picker is open
  useEffect(() => {
    if (activeTab === 'menu' || showCart || showLocationPicker) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeTab, showCart, showLocationPicker])

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })
  const locations = useMemo(() => locationsData?.data?.locations || [], [locationsData])

  // Auto-select first location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  // Fetch tables for selected location
  const { data: tablesData } = useQuery({
    queryKey: ['tables', selectedLocationId],
    queryFn: () => apiGet<{ data: { tables: Table[] } }>('/tables', { location_id: selectedLocationId }),
    enabled: !!selectedLocationId,
  })
  const tables = useMemo(() => tablesData?.data?.tables || [], [tablesData])

  // Fetch active orders
  const { data: ordersData, refetch: refetchOrders } = useActiveOrders(selectedLocationId)
  const orders = useMemo(() => ordersData?.data?.orders || [], [ordersData])

  // Fetch menu items
  const { data: menuItemsData } = useQuery({
    queryKey: ['menu-items-all'],
    queryFn: () => apiGet<{ data: { items: Array<MenuItem & { category: { id: string; name: string } }> } }>('/menu/items'),
  })
  const menuItems = useMemo(() => menuItemsData?.data?.items || [], [menuItemsData])

  // Extract categories
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { id: string; name: string }>()
    menuItems.forEach(item => {
      if (item.category) {
        categoryMap.set(item.category.id, item.category)
      }
    })
    return Array.from(categoryMap.values())
  }, [menuItems])

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategoryId || 
        item.category?.id === selectedCategoryId
      return matchesSearch && matchesCategory && item.is_active
    })
  }, [menuItems, searchQuery, selectedCategoryId])

  // Get orders for a table
  const getTableOrders = useCallback((tableId: string) => {
    return orders.filter(o => o.table_id === tableId && !['completed', 'cancelled'].includes(o.status))
  }, [orders])

  // Cart operations
  const addToCart = useCallback((item: MenuItem & { category?: { id: string; name: string } }) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) {
        return prev.map(c => 
          c.menuItem.id === item.id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, { id: crypto.randomUUID(), menuItem: item, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.id === cartItemId ? { ...c, quantity: c.quantity + delta } : c)
      .filter(c => c.quantity > 0)
    )
  }, [])

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(c => c.id !== cartItemId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setCustomerName('')
  }, [])

  // Totals
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.menuItem.base_price * item.quantity), 0)
  }, [cart])

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  // Create order
  const createOrder = useCreateOrder()
  const updateOrderStatus = useUpdateOrderStatus()

  // Handle cancel order
  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus.mutate(
      { id: orderId, status: 'cancelled' },
      {
        onSuccess: () => {
          toast.success(t('orderCancelled'))
        },
        onError: () => {
          toast.error(t('orderCancelFailed'))
        },
      }
    )
  }

  // State for viewing order details
  const [selectedOrder, setSelectedOrder] = useState<OrderWithRelations | null>(null)

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      toast.error(tCreate('selectLocation'))
      return
    }
    if (cart.length === 0) {
      toast.error(tCreate('addItemsFirst'))
      return
    }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error(tCreate('selectTable'))
      return
    }

    try {
      await createOrder.mutateAsync({
        location_id: selectedLocationId,
        table_id: orderType === 'dine_in' ? selectedTable?.id : undefined,
        type: orderType,
        customer_name: customerName || undefined,
        items: cart.map(c => ({
          menu_item_id: c.menuItem.id,
          quantity: c.quantity,
        })),
      })

      toast.success(tCreate('orderCreated'))
      clearCart()
      setSelectedTable(null)
      setActiveTab('tables')
      refetchOrders()
    } catch (error: any) {
      toast.error(tCreate('orderFailed'), {
        description: error?.message || 'Unknown error',
      })
    }
  }

  // Select table and go to menu
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table)
    setOrderType('dine_in')
    setActiveTab('menu')
  }

  // Start takeaway/delivery order
  const handleQuickOrder = (type: OrderType) => {
    setSelectedTable(null)
    setOrderType(type)
    setActiveTab('menu')
  }

  const currentLocation = locations.find(l => l.id === selectedLocationId)

  // Tables View
  const TablesView = () => (
    <div className="flex flex-col h-full">
      {/* Quick order buttons */}
      <div className="py-3 border-b">
        <div className="grid grid-cols-3 gap-2">
          <button
            className="flex flex-col items-center justify-center gap-1 h-14 px-2 rounded-lg border bg-background hover:bg-muted transition-colors"
            onClick={() => handleQuickOrder('dine_in')}
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate max-w-full">{t('dine_in')}</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-1 h-14 px-2 rounded-lg border bg-background hover:bg-muted transition-colors"
            onClick={() => handleQuickOrder('takeaway')}
          >
            <Package className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate max-w-full">{t('takeaway')}</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-1 h-14 px-2 rounded-lg border bg-background hover:bg-muted transition-colors"
            onClick={() => handleQuickOrder('delivery')}
          >
            <Truck className="h-5 w-5" />
            <span className="text-[10px] font-medium truncate max-w-full">{t('delivery')}</span>
          </button>
        </div>
      </div>

      {/* Tables grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 pb-5 scrollbar-hide">
        <div className="grid grid-cols-2 gap-3">
          {[...tables, ...tables, ...tables].map(table => {
            const tableOrders = getTableOrders(table.id)
            const hasOrders = tableOrders.length > 0
            const latestOrder = tableOrders[0]
            
            return (
              <button
                key={table.id}
                onClick={() => handleTableSelect(table)}
                className={cn(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[100px]",
                  "active:scale-95",
                  hasOrders 
                    ? "border-primary bg-primary/5" 
                    : "border-border bg-background hover:border-muted-foreground"
                )}
              >
                <UtensilsCrossed className={cn(
                  "h-6 w-6 mb-2",
                  hasOrders ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="font-semibold text-lg">{table.name}</span>
                {table.zone && (
                  <span className="text-xs text-muted-foreground">{table.zone}</span>
                )}
                {hasOrders && latestOrder && (
                  <Badge 
                    className={cn("absolute top-2 right-2 text-xs text-white", statusColors[latestOrder.status])}
                  >
                    {tableOrders.length}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
        {tables.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noTables')}</p>
          </div>
        )}
      </div>
    </div>
  )

  // Orders View
  const OrdersView = () => (
    <div className="h-full overflow-y-auto overflow-x-hidden py-4 pb-20 scrollbar-hide">
      <div className="space-y-3">
        {orders.map(order => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-white", statusColors[order.status])}>
                    #{order.order_number}
                  </Badge>
                  {order.table && (
                    <span className="text-sm font-medium">{order.table.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {order.placed_at && new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleCancelOrder(order.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('cancelOrder')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {order.items?.slice(0, 2).map(item => (
                  <div key={item.id}>{item.quantity}x {item.item_name}</div>
                ))}
                {(order.items?.length || 0) > 2 && (
                  <div className="text-xs">+{(order.items?.length || 0) - 2} more</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="font-semibold">€{order.total.toFixed(2)}</span>
                <Badge variant="outline">{t(`status.${order.status}`)}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t('noActiveOrders')}</p>
          </div>
        )}
      </div>
    </div>
  )

  // Menu View
  const MenuView = () => (
    <div className="flex flex-col h-full">
      {/* Header with back and table info */}
      <div className="py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setActiveTab('tables')
              clearCart()
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            {selectedTable ? (
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                <span className="font-semibold">{selectedTable.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {orderType === 'takeaway' ? <Package className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                <span className="font-semibold">{t(orderType)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setShowSearch(!showSearch)
                if (!showSearch) {
                  setTimeout(() => searchInputRef.current?.focus(), 100)
                } else {
                  setSearchQuery('')
                }
              }}
            >
              <Search className="h-5 w-5" />
            </Button>
            {cartItemsCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {cartItemsCount}
              </Button>
            )}
          </div>
        </div>

        {/* Search Input - Collapsible */}
        {showSearch && (
          <div className="relative mt-3 mx-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={tCreate('searchItems')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
            {searchQuery && (
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Category tabs */}
      <div className="border-b overflow-x-auto overflow-y-hidden">
        <div className="flex py-2 gap-2">
          <Button
            variant={selectedCategoryId === null ? 'default' : 'ghost'}
            size="sm"
            className="h-10 px-4"
            onClick={() => setSelectedCategoryId(null)}
          >
            {tCreate('allCategories')}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? 'default' : 'ghost'}
              size="sm"
              className="h-10 px-4 whitespace-nowrap"
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="py-3 space-y-2 pb-20">
          {filteredItems.map(item => {
            const cartItem = cart.find(c => c.menuItem.id === item.id)
            const quantity = cartItem?.quantity || 0
            
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  quantity > 0 ? "border-primary bg-primary/5" : "border-border",
                  item.is_sold_out && "opacity-50"
                )}
              >
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.image_urls && item.image_urls[0] ? (
                    <Image
                      src={item.image_urls[0]}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UtensilsCrossed className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-sm text-muted-foreground">€{item.base_price.toFixed(2)}</div>
                </div>
                
                {quantity > 0 ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => updateQuantity(cartItem!.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-lg">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => updateQuantity(cartItem!.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => addToCart(item)}
                    disabled={item.is_sold_out}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom bar - Place order */}
      {cartItemsCount > 0 && (
        <div className="shrink-0 p-4 pb-safe border-t bg-background">
          <Button
            className="w-full h-14 text-lg font-semibold"
            onClick={handleSubmit}
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? (
              tCreate('creating')
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                {tCreate('placeOrder')} · €{cartTotal.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )

  // Cart Sheet
  const CartSheet = () => (
    <Sheet open={showCart} onOpenChange={setShowCart}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="shrink-0 pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>{tCreate('cart')} ({cartItemsCount})</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-1" />
                {tCreate('clear')}
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.menuItem.name}</div>
                  <div className="text-sm text-muted-foreground">
                    €{(item.menuItem.base_price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className="shrink-0 pt-4 pb-safe space-y-3">
          <Input
            placeholder={tCreate('customerName')}
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="h-12"
          />
          <Button
            className="w-full h-14 text-lg font-semibold"
            onClick={() => {
              setShowCart(false)
              handleSubmit()
            }}
            disabled={createOrder.isPending || cart.length === 0}
          >
            {tCreate('placeOrder')} · €{cartTotal.toFixed(2)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )

  // Location Picker Sheet
  const LocationPickerSheet = () => (
    <Sheet open={showLocationPicker} onOpenChange={setShowLocationPicker}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{t('selectLocation')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 pb-4">
          {locations.map(loc => (
            <button
              key={loc.id}
              onClick={() => {
                setSelectedLocationId(loc.id)
                setShowLocationPicker(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                selectedLocationId === loc.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{loc.name}</span>
              {selectedLocationId === loc.id && (
                <Check className="h-5 w-5 text-primary ml-auto" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Order Details Sheet
  const OrderDetailsSheet = () => (
    <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        {selectedOrder && (
          <>
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center justify-between">
                <span>{t('orderDetails')} #{selectedOrder.order_number}</span>
                <Badge className={cn("text-white", statusColors[selectedOrder.status])}>
                  {t(`status.${selectedOrder.status}`)}
                </Badge>
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {/* Order info */}
                <div className="flex items-center gap-4 text-sm">
                  {selectedOrder.table && (
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.table.name}</span>
                    </div>
                  )}
                  {selectedOrder.type && (
                    <Badge variant="outline">
                      {selectedOrder.type === 'dine_in' ? t('dine_in') : 
                       selectedOrder.type === 'takeaway' ? t('takeaway') : t('delivery')}
                    </Badge>
                  )}
                  {selectedOrder.placed_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(selectedOrder.placed_at).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                {/* Customer info */}
                {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedOrder.customer_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div className="text-muted-foreground ml-6">{selectedOrder.customer_phone}</div>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-medium">{t('items')}</h4>
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{item.quantity}x {item.item_name}</div>
                        {item.variant_name && (
                          <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-amber-500 mt-1">{item.notes}</div>
                        )}
                      </div>
                      <span className="font-medium">€{item.total_price?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {selectedOrder.customer_notes && (
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <div className="text-sm font-medium text-amber-500 mb-1">{t('notes')}</div>
                    <div className="text-sm">{selectedOrder.customer_notes}</div>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between text-lg font-semibold pt-3 border-t">
                  <span>{t('total')}</span>
                  <span>€{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="pt-4 pb-6 safe-area-pb space-y-2">
              {selectedOrder.status !== 'cancelled' && (
                <Button 
                  variant="destructive" 
                  className="w-full h-12"
                  onClick={() => {
                    handleCancelOrder(selectedOrder.id)
                    setSelectedOrder(null)
                  }}
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  {t('cancelOrder')}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => setSelectedOrder(null)}
              >
                {t('close')}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem-2rem)] lg:h-[calc(100dvh-4rem-3rem)] bg-background overflow-x-hidden">
      {/* Top header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <button 
          onClick={() => setShowLocationPicker(true)}
          className="flex items-center gap-2 text-left"
        >
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <div className="font-semibold">{currentLocation?.name || t('selectLocation')}</div>
            <div className="text-xs text-muted-foreground">{t('tapToChange')}</div>
          </div>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden overflow-x-hidden">
        {activeTab === 'tables' && <TablesView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'menu' && <MenuView />}
      </div>

      {/* Bottom navigation - only show when not in menu */}
      {activeTab !== 'menu' && (
        <div className="shrink-0 flex border-t bg-background/95 backdrop-blur-sm shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-40 pb-safe">
          <button
            onClick={() => setActiveTab('tables')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 pt-3 transition-colors",
              activeTab === 'tables' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Grid3X3 className="h-6 w-6" />
            <span className="text-xs font-medium">{t('tables')}</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 pt-3 transition-colors relative",
              activeTab === 'orders' ? "text-primary" : "text-muted-foreground"
            )}
          >
            <ClipboardList className="h-6 w-6" />
            <span className="text-xs font-medium">{t('orders')}</span>
            {orders.length > 0 && (
              <Badge className="absolute top-1 right-1/4 h-5 min-w-[20px] text-xs">
                {orders.length}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* Sheets */}
      <CartSheet />
      <LocationPickerSheet />
      <OrderDetailsSheet />
    </div>
  )
}
