'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import { AnimatedDiv, AnimatedList, AnimatedListItem } from '@/components/ui/animated'
import { DashboardOverviewSkeleton } from '@/components/ui/skeletons'

type Timeframe = 'day' | 'month' | 'year'

interface AnalyticsData {
  summary: {
    totalEarnings: number
    totalOrders: number
    completedOrders: number
    avgOrderValue: number
    earningsChange: number
    ordersChange: number
  }
  earningsChart: { date: string; earnings: number; orders: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  topWaiters: { id: string; name: string; avatar?: string; orders: number; revenue: number }[]
  orderTypesChart: { name: string; value: number; color: string }[]
  peakHoursChart: { hour: string; orders: number }[]
  statusStats: Record<string, number>
  timeframe: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface Location {
  id: string
  name: string
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  
  // Use stable date reference for "today"
  const today = useMemo(() => new Date(), [])
  
  const [timeframe, setTimeframe] = useState<Timeframe>('day')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  // Fetch locations
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet<{ data: { locations: Location[] } }>('/locations'),
  })

  const locations = locationsData?.data?.locations || []

  // Generate available years (last 5 years)
  const years = useMemo(() => {
    const currentYear = today.getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [today])

  // Generate days in selected month
  const daysInMonth = useMemo(() => {
    const days = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => i + 1)
  }, [selectedYear, selectedMonth])

  // Build query params based on timeframe and location
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.set('timeframe', timeframe)
    params.set('year', selectedYear.toString())
    if (timeframe === 'day' || timeframe === 'month') {
      params.set('month', (selectedMonth + 1).toString())
    }
    if (timeframe === 'day') {
      params.set('day', selectedDay.toString())
    }
    if (selectedLocation !== 'all') {
      params.set('location_id', selectedLocation)
    }
    return params.toString()
  }, [timeframe, selectedYear, selectedMonth, selectedDay, selectedLocation])

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-overview', queryParams],
    queryFn: () => apiGet<{ data: AnalyticsData }>(`/analytics/overview?${queryParams}`),
    refetchInterval: 60000, // Refresh every minute
  })

  const data = analyticsData?.data

  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: 'day', label: t('timeframe.day') },
    { value: 'month', label: t('timeframe.month') },
    { value: 'year', label: t('timeframe.year') },
  ]

  // Handle timeframe change - reset to current date
  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe)
    setSelectedYear(today.getFullYear())
    setSelectedMonth(today.getMonth())
    setSelectedDay(today.getDate())
  }

  // Navigate day
  const navigateDay = (delta: number) => {
    const date = new Date(selectedYear, selectedMonth, selectedDay + delta)
    if (date <= today) {
      setSelectedYear(date.getFullYear())
      setSelectedMonth(date.getMonth())
      setSelectedDay(date.getDate())
    }
  }

  // Navigate month
  const navigateMonth = (delta: number) => {
    const date = new Date(selectedYear, selectedMonth + delta, 1)
    if (date <= today) {
      setSelectedYear(date.getFullYear())
      setSelectedMonth(date.getMonth())
    }
  }

  // Format selected date for display
  const formattedDate = useMemo(() => {
    if (timeframe === 'day') {
      return new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    if (timeframe === 'month') {
      return `${MONTHS[selectedMonth]} ${selectedYear}`
    }
    return selectedYear.toString()
  }, [timeframe, selectedYear, selectedMonth, selectedDay])

  // Check if we can go forward
  const canGoForward = useMemo(() => {
    if (timeframe === 'day') {
      const selectedDate = new Date(selectedYear, selectedMonth, selectedDay)
      return selectedDate < today
    }
    if (timeframe === 'month') {
      return selectedYear < today.getFullYear() || 
        (selectedYear === today.getFullYear() && selectedMonth < today.getMonth())
    }
    return selectedYear < today.getFullYear()
  }, [timeframe, selectedYear, selectedMonth, selectedDay, today])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: {entry.name === 'earnings' ? `€${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  console.log(data?.topWaiters)

  return (
    <div className="space-y-6">
      {/* Header with timeframe selector - Always visible */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">{t('overview.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            {timeframeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeframe === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleTimeframeChange(option.value)}
                className="px-4"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          
          {/* Year Selector - Always visible */}
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Selector - For day and month timeframe */}
          {(timeframe === 'day' || timeframe === 'month') && (
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem 
                    key={month} 
                    value={index.toString()}
                    disabled={selectedYear === today.getFullYear() && index > today.getMonth()}
                  >
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Day Selector - For day timeframe */}
          {timeframe === 'day' && (
            <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {daysInMonth.map((day) => (
                  <SelectItem 
                    key={day} 
                    value={day.toString()}
                    disabled={
                      selectedYear === today.getFullYear() && 
                      selectedMonth === today.getMonth() && 
                      day > today.getDate()
                    }
                  >
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Quick Navigation */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (timeframe === 'day') navigateDay(-1)
                else if (timeframe === 'month') navigateMonth(-1)
                else setSelectedYear(y => y - 1)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (timeframe === 'day') navigateDay(1)
                else if (timeframe === 'month') navigateMonth(1)
                else setSelectedYear(y => Math.min(y + 1, today.getFullYear()))
              }}
              disabled={!canGoForward}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Formatted Date Display */}
          <span className="text-sm font-medium text-muted-foreground ml-2">
            {formattedDate}
          </span>

          {/* Separator */}
          <div className="w-px h-6 bg-border ml-2" />

          {/* Location Selector */}
          <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('overview.allLocations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('overview.allLocations')}</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show skeleton or data based on loading state */}
      {isLoading ? (
        <DashboardOverviewSkeleton />
      ) : (
        <AnimatedList className="space-y-6">
          {/* Summary Stats */}
          <AnimatedListItem className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.totalEarnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(data?.summary.totalEarnings || 0).toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {(data?.summary.earningsChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={cn(
                (data?.summary.earningsChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {(data?.summary.earningsChange || 0) >= 0 ? '+' : ''}{data?.summary.earningsChange || 0}%
              </span>
              <span className="ml-1">{t('overview.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.totalOrders')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.totalOrders || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {(data?.summary.ordersChange || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={cn(
                (data?.summary.ordersChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
              )}>
                {(data?.summary.ordersChange || 0) >= 0 ? '+' : ''}{data?.summary.ordersChange || 0}%
              </span>
              <span className="ml-1">{t('overview.vsPreviousPeriod')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.avgOrderValue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(data?.summary.avgOrderValue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('overview.perOrder')}
            </p>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('overview.completedOrders')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.summary.totalOrders ? 
                `${((data.summary.completedOrders / data.summary.totalOrders) * 100).toFixed(0)}% ${t('overview.completionRate')}` 
                : t('overview.noOrders')
              }
            </p>
          </CardContent>
        </Card>
      </AnimatedListItem>

      {/* Charts Row */}
      <AnimatedListItem className="grid gap-4 lg:grid-cols-2">
        {/* Earnings Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('overview.earningsOverTime')}</CardTitle>
            <CardDescription>
              {timeframe === 'day' ? t('overview.hourlyBreakdown') : t('overview.dailyBreakdown')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data?.earningsChart && data.earningsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.earningsChart}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => timeframe === 'day' ? value : (timeframe === 'year' ? value : value.slice(5))}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorEarnings)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ fill: 'hsl(var(--primary))', r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('overview.noData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Types Pie Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('overview.orderTypes')}</CardTitle>
            <CardDescription>{t('overview.orderTypesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data?.orderTypesChart && data.orderTypesChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.orderTypesChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {data.orderTypesChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('overview.noData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedListItem>

      {/* Products and Waiters Row */}
      <AnimatedListItem className="grid gap-4 lg:grid-cols-2">
        {/* Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              {t('overview.bestSellingProducts')}
            </CardTitle>
            <CardDescription>{t('overview.bestSellingProductsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {data?.topProducts && data.topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {t('overview.noData')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Waiters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              {t('overview.topWaiters')}
            </CardTitle>
            <CardDescription>{t('overview.topWaitersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topWaiters && data.topWaiters.length > 0 ? (
              <AnimatedList stagger="fast" className="space-y-4">
                {data.topWaiters.map((waiter, index) => (
                  <AnimatedListItem key={waiter.id} className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                      index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" :
                      index === 1 ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" :
                      index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={waiter.avatar} />
                      <AvatarFallback>{waiter.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{waiter.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {waiter.orders} {t('overview.ordersServed')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">€{waiter.revenue.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{t('overview.totalRevenue')}</p>
                    </div>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                {t('overview.noData')}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedListItem>

      {/* Peak Hours */}
      <AnimatedListItem>
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            {t('overview.peakHours')}
          </CardTitle>
          <CardDescription>{t('overview.peakHoursDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {data?.peakHoursChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.peakHoursChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    interval={1}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {t('overview.noData')}
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </AnimatedListItem>
        </AnimatedList>
      )}
    </div>
  )
}
