'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Calendar,
  ArrowUpRight,
  BarChart3,
  PieChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data for now - will be replaced with real API data
const mockAnalytics = {
  today: {
    revenue: 1234.50,
    orders: 24,
    avgOrderValue: 51.44,
    customers: 18,
  },
  yesterday: {
    revenue: 1100.00,
    orders: 21,
    avgOrderValue: 52.38,
    customers: 15,
  },
  topItems: [
    { name: 'Margherita Pizza', quantity: 45, revenue: 450 },
    { name: 'Caesar Salad', quantity: 32, revenue: 288 },
    { name: 'Grilled Salmon', quantity: 28, revenue: 476 },
    { name: 'Tiramisu', quantity: 24, revenue: 168 },
    { name: 'Pasta Carbonara', quantity: 22, revenue: 286 },
  ],
  ordersByHour: [
    { hour: '11:00', orders: 5 },
    { hour: '12:00', orders: 12 },
    { hour: '13:00', orders: 15 },
    { hour: '14:00', orders: 8 },
    { hour: '18:00', orders: 10 },
    { hour: '19:00', orders: 18 },
    { hour: '20:00', orders: 20 },
    { hour: '21:00', orders: 12 },
  ],
  ordersByType: {
    dine_in: 65,
    takeaway: 25,
    delivery: 10,
  },
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today')

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const revenueChange = calculateChange(mockAnalytics.today.revenue, mockAnalytics.yesterday.revenue)
  const ordersChange = calculateChange(mockAnalytics.today.orders, mockAnalytics.yesterday.orders)
  const avgOrderChange = calculateChange(mockAnalytics.today.avgOrderValue, mockAnalytics.yesterday.avgOrderValue)
  const customersChange = calculateChange(mockAnalytics.today.customers, mockAnalytics.yesterday.customers)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your business performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('today')}
          >
            Today
          </Button>
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('week')}
          >
            This Week
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod('month')}
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{mockAnalytics.today.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {revenueChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
              {' '}vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.today.orders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {ordersChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(ordersChange).toFixed(1)}%
              </span>
              {' '}vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{mockAnalytics.today.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {avgOrderChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={avgOrderChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(avgOrderChange).toFixed(1)}%
              </span>
              {' '}vs yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.today.customers}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {customersChange >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={customersChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(customersChange).toFixed(1)}%
              </span>
              {' '}vs yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Orders by hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Orders by Hour
            </CardTitle>
            <CardDescription>Peak ordering times today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockAnalytics.ordersByHour.map((item) => {
                const maxOrders = Math.max(...mockAnalytics.ordersByHour.map(i => i.orders))
                const percentage = (item.orders / maxOrders) * 100
                return (
                  <div key={item.hour} className="flex items-center gap-3">
                    <span className="w-12 text-sm text-muted-foreground">{item.hour}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm font-medium text-right">{item.orders}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Orders by type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Orders by Type
            </CardTitle>
            <CardDescription>Distribution of order types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span>Dine-in</span>
                </div>
                <span className="font-medium">{mockAnalytics.ordersByType.dine_in}%</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${mockAnalytics.ordersByType.dine_in}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span>Takeaway</span>
                </div>
                <span className="font-medium">{mockAnalytics.ordersByType.takeaway}%</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${mockAnalytics.ordersByType.takeaway}%` }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span>Delivery</span>
                </div>
                <span className="font-medium">{mockAnalytics.ordersByType.delivery}%</span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${mockAnalytics.ordersByType.delivery}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top selling items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Selling Items
          </CardTitle>
          <CardDescription>Best performing menu items this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
