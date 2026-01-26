'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Settings,
  Bell,
  ChefHat,
  Table,
  Menu,
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import Link from 'next/link'
import type { OrderWithRelations, Table as TableType, MenuItem } from '@/lib/types'

// Helper to format time ago
const formatTimeAgo = (date: string) => {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  // Fetch today's orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'today'],
    queryFn: () => apiGet<{ data: { orders: OrderWithRelations[] } }>('/orders'),
    refetchInterval: 30000, // Refresh every 30s
  })

  // Fetch tables
  const { data: tablesData } = useQuery({
    queryKey: ['tables'],
    queryFn: () => apiGet<{ data: { tables: TableType[] } }>('/tables'),
  })

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: () => apiGet<{ data: any }>('/analytics/today'),
  })

  const orders = ordersData?.data?.orders || []
  const tables = tablesData?.data?.tables || []
  const analytics = analyticsData?.data || {}

  // Calculate stats
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at)
    const today = new Date()
    return orderDate.toDateString() === today.toDateString()
  })

  const activeOrders = orders.filter(o => 
    ['placed', 'accepted', 'preparing', 'ready', 'served'].includes(o.status)
  )

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const activeTables = tables.filter(t => t.status === 'occupied').length
  const totalTables = tables.length

  // Calculate average order time (mock for now)
  const avgOrderTime = analytics.avgOrderTime || 18

  // Get recent orders (last 10)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  // Calculate top items
  const itemStats = new Map<string, { name: string; orders: number; revenue: number }>()
  orders.forEach(order => {
    order.items?.forEach(item => {
      const existing = itemStats.get(item.item_name) || { name: item.item_name, orders: 0, revenue: 0 }
      existing.orders += item.quantity
      existing.revenue += item.total_price || 0
      itemStats.set(item.item_name, existing)
    })
  })
  const topItems = Array.from(itemStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const stats = [
    {
      title: t('stats.ordersToday'),
      value: todayOrders.length.toString(),
      change: analytics.ordersTrend || '+0%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
    },
    {
      title: t('stats.revenueToday'),
      value: `€${todayRevenue.toFixed(2)}`,
      change: analytics.revenueTrend || '+0%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: t('stats.activeTables'),
      value: `${activeTables}/${totalTables}`,
      change: totalTables > 0 ? `${Math.round((activeTables / totalTables) * 100)}%` : '0%',
      changeType: 'neutral' as const,
      icon: Users,
    },
    {
      title: t('stats.avgOrderTime'),
      value: `${avgOrderTime} min`,
      change: analytics.orderTimeTrend || '-',
      changeType: 'positive' as const,
      icon: Clock,
    },
  ]

  const quickActions = [
    { label: t('quickActions.viewOrders'), icon: Bell, href: '/dashboard/orders', variant: 'default' as const },
    { label: t('quickActions.manageMenu'), icon: Menu, href: '/dashboard/menu', variant: 'outline' as const },
    { label: t('quickActions.manageTables'), icon: Table, href: '/dashboard/tables', variant: 'outline' as const },
    { label: t('quickActions.settings'), icon: Settings, href: '/dashboard/settings', variant: 'outline' as const },
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('welcome')}
          </p>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant={action.variant} size="sm" className="gap-1.5">
                <action.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stat.changeType === 'positive' && (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                )}
                <span className={
                  stat.changeType === 'positive' ? 'text-green-500' : ''
                }>
                  {stat.change}
                </span>
                {' '}{tc('fromYesterday')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent orders */}
        <Card className="col-span-4 flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>{t('recentOrders.title')}</CardTitle>
            <CardDescription>{t('recentOrders.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('recentOrders.noOrders')}
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto h-[400px] pr-2">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="font-medium shrink-0">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {order.table?.name || order.customer_name || tc('takeaway')}
                        </div>
                        <div className="text-sm shrink-0">{order.items?.length || 0} {tc('items')}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="shrink-0">
                          {tc(`orderStatus.${order.status}`)}
                        </Badge>
                        <div className="font-medium shrink-0">€{order.total?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          {formatTimeAgo(order.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top items */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="shrink-0">
            <CardTitle>{t('topItems.title')}</CardTitle>
            <CardDescription>{t('topItems.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {topItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('topItems.noItems')}
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto h-[400px] pr-2">
                {topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.orders} {t('topItems.orders')}</p>
                    </div>
                    <div className="font-medium shrink-0">€{item.revenue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
