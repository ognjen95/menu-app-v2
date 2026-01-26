'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

// Mock data - will be replaced with real data from API
const getStats = (t: ReturnType<typeof useTranslations>) => [
  {
    title: t('stats.ordersToday'),
    value: '24',
    change: '+12%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
  },
  {
    title: t('stats.revenueToday'),
    value: '€1,234',
    change: '+8%',
    changeType: 'positive' as const,
    icon: DollarSign,
  },
  {
    title: t('stats.activeTables'),
    value: '8/12',
    change: '67%',
    changeType: 'neutral' as const,
    icon: Users,
  },
  {
    title: t('stats.avgOrderTime'),
    value: '18 min',
    change: '-2 min',
    changeType: 'positive' as const,
    icon: Clock,
  },
]

const recentOrders = [
  { id: '#001', table: 'T1', items: 3, total: '€45.00', status: 'preparing', time: '5 min ago' },
  { id: '#002', table: 'T4', items: 2, total: '€28.50', status: 'ready', time: '8 min ago' },
  { id: '#003', table: 'Takeaway', items: 5, total: '€67.00', status: 'completed', time: '12 min ago' },
  { id: '#004', table: 'T2', items: 4, total: '€52.00', status: 'placed', time: '2 min ago' },
]

const topItems = [
  { name: 'Margherita Pizza', orders: 45, revenue: '€450' },
  { name: 'Caesar Salad', orders: 32, revenue: '€288' },
  { name: 'Grilled Salmon', orders: 28, revenue: '€476' },
  { name: 'Tiramisu', orders: 24, revenue: '€168' },
]

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const stats = getStats(t)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('welcome')}
        </p>
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
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('recentOrders.title')}</CardTitle>
            <CardDescription>{t('recentOrders.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-medium">{order.id}</div>
                    <div className="text-sm text-muted-foreground">{order.table}</div>
                    <div className="text-sm">{order.items} {tc('items')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'placed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                      order.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {order.status}
                    </span>
                    <div className="font-medium">{order.total}</div>
                    <div className="text-xs text-muted-foreground w-16 text-right">{order.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top items */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('topItems.title')}</CardTitle>
            <CardDescription>{t('topItems.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.orders} {t('topItems.orders')}</p>
                  </div>
                  <div className="font-medium">{item.revenue}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{t('quickActions.addMenuItem')}</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{t('quickActions.newOrder')}</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
              <Users className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{t('quickActions.inviteStaff')}</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">{t('quickActions.viewReports')}</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
