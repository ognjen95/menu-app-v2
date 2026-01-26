'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useActiveOrders, useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Car,
  Table,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithRelations } from '@/lib/types'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  placed: { label: 'New', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: Bell },
  served: { label: 'Served', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle },
}

const typeIcons = {
  dine_in: Store,
  takeaway: User,
  delivery: Truck,
}

export default function OrdersPage() {
  const t = useTranslations('ordersPage')
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all')
  const { data, isLoading, refetch } = useActiveOrders()
  const updateStatus = useUpdateOrderStatus()

  const orders = data?.data?.orders || []
  
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === selectedStatus)

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          {t('refresh')}
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus('all')}
        >
          {t('all')} ({orders.length})
        </Button>
        {(['placed', 'accepted', 'preparing', 'ready', 'served'] as OrderStatus[]).map((status) => {
          const config = statusConfig[status]
          const count = statusCounts[status] || 0
          return (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
              className="gap-2"
            >
              <config.icon className="h-4 w-4" />
              {t(`status.${status}`)} ({count})
            </Button>
          )
        })}
      </div>

      {/* Orders grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}</div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noOrdersFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status].icon
            const TypeIcon = typeIcons[order.type] || Store
            const nextStatus = getNextStatus(order.status)

            return (
              <Card key={order.id} className="relative overflow-hidden">
                {/* Status indicator bar */}
                <div className={cn(
                  'absolute top-0 left-0 right-0 h-1',
                  order.status === 'placed' && 'bg-blue-500',
                  order.status === 'accepted' && 'bg-indigo-500',
                  order.status === 'preparing' && 'bg-yellow-500',
                  order.status === 'ready' && 'bg-green-500 animate-pulse',
                )} />

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{order.order_number}</span>
                      <Badge variant="outline" className="gap-1">
                        <TypeIcon className="h-5 w-5" />
                        {t(`type.${order.type}`)}
                      </Badge>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {order.table_id && <Badge className="flex items-center gap-2"><Table className="h-4 w-4" /> {`${order.table?.name}, ${order?.table?.zone}`}</Badge>}
                    {order.customer_name && <Badge className="flex items-center gap-2"><User className="h-4 w-4" /> {order.customer_name}</Badge>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order items preview */}
                  <div className="space-y-1 text-sm">
                    {order.items?.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="truncate">{item.quantity}x {item.item_name}</span>
                        <span className="text-muted-foreground">
                          €{item.total_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div className="text-muted-foreground">
                        {t('moreItems', { count: (order.items?.length || 0) - 3 })}
                      </div>
                    )}
                  </div>

                  {/* Total and status */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <span className="text-lg font-bold">
                        €{order.total.toFixed(2)}
                      </span>
                    </div>
                    <Badge className={statusConfig[order.status].color}>
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
          })}
        </div>
      )}
    </div>
  )
}
