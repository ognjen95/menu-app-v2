import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  // Get timeframe and date params from query
  const searchParams = request.nextUrl.searchParams
  const timeframe = searchParams.get('timeframe') || 'day' // day, month, year
  const now = new Date()
  
  // Parse date parameters
  const year = parseInt(searchParams.get('year') || now.getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString()) - 1 // 0-indexed
  const day = parseInt(searchParams.get('day') || now.getDate().toString())

  // Calculate date range based on timeframe
  let startDate: Date
  let endDate: Date
  
  switch (timeframe) {
    case 'day':
      // Single day: from start of day to end of day
      startDate = new Date(year, month, day, 0, 0, 0)
      endDate = new Date(year, month, day, 23, 59, 59, 999)
      break
    case 'month':
      // Full month: from 1st to last day of month
      startDate = new Date(year, month, 1, 0, 0, 0)
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
      break
    case 'year':
      // Full year: from Jan 1 to Dec 31
      startDate = new Date(year, 0, 1, 0, 0, 0)
      endDate = new Date(year, 11, 31, 23, 59, 59, 999)
      break
    default:
      startDate = new Date(year, month, day, 0, 0, 0)
      endDate = new Date(year, month, day, 23, 59, 59, 999)
  }

  // Get location filter
  const locationId = searchParams.get('location_id')

  // Fetch orders with items
  let ordersQuery = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total,
      type,
      status,
      created_at,
      served_by,
      accepted_by,
      assigned_to,
      location_id,
      items:order_items(
        id,
        item_name,
        menu_item_id,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq('tenant_id', tenantUser.tenant_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  // Add location filter if specified
  if (locationId) {
    ordersQuery = ordersQuery.eq('location_id', locationId)
  }

  const { data: orders, error: ordersError } = await ordersQuery

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 })
  }

  // Fetch team members for waiter names
  const { data: teamMembers } = await supabase
    .from('tenant_users')
    .select(`
      user_id,
      role,
      profiles:user_id(full_name, avatar_url)
    `)
    .eq('tenant_id', tenantUser.tenant_id)
    .in('role', ['waiter', 'staff', 'manager', 'owner'])

  // Process data
  const completedOrders = orders?.filter(o => 
    ['completed', 'served', 'paid'].includes(o.status)
  ) || []

  // 1. Total Earnings
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalOrders = orders?.length || 0
  const avgOrderValue = totalOrders > 0 ? totalEarnings / completedOrders.length : 0

  // 2. Earnings over time (grouped by hour/day/month based on timeframe)
  const earningsByPeriod: { [key: string]: { date: string; earnings: number; orders: number } } = {}
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Initialize all periods with 0 values first
  if (timeframe === 'day') {
    // Initialize 24 hours
    for (let h = 0; h < 24; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`
      earningsByPeriod[key] = { date: key, earnings: 0, orders: 0 }
    }
  } else if (timeframe === 'month') {
    // Initialize all days in the selected month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`
      earningsByPeriod[dateStr] = { date: dateStr, earnings: 0, orders: 0 }
    }
  } else {
    // Initialize all 12 months for year view
    monthNames.forEach(m => {
      earningsByPeriod[m] = { date: m, earnings: 0, orders: 0 }
    })
  }
  
  // Now fill in actual data
  completedOrders.forEach(order => {
    const date = new Date(order.created_at)
    let key: string
    
    if (timeframe === 'day') {
      // Group by hour for day view
      key = `${date.getHours().toString().padStart(2, '0')}:00`
    } else if (timeframe === 'month') {
      // Group by date for month view
      key = date.toISOString().split('T')[0]
    } else {
      // Group by month for year view
      key = monthNames[date.getMonth()]
    }
    
    if (earningsByPeriod[key]) {
      earningsByPeriod[key].earnings += order.total || 0
      earningsByPeriod[key].orders += 1
    }
  })

  // Sort earnings chart appropriately
  let earningsChart = Object.values(earningsByPeriod)
  if (timeframe === 'year') {
    // Sort by month order for year view
    earningsChart = earningsChart.sort((a, b) => monthNames.indexOf(a.date) - monthNames.indexOf(b.date))
  } else {
    earningsChart = earningsChart.sort((a, b) => a.date.localeCompare(b.date))
  }

  // 3. Best selling products
  const productStats: { [key: string]: { name: string; quantity: number; revenue: number } } = {}
  
  orders?.forEach(order => {
    order.items?.forEach((item: any) => {
      const name = item.item_name
      if (!productStats[name]) {
        productStats[name] = { name, quantity: 0, revenue: 0 }
      }
      productStats[name].quantity += item.quantity || 0
      productStats[name].revenue += item.total_price || 0
    })
  })

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  // 4. Best waiters (by number of orders served)
  const waiterStats: { [key: string]: { id: string; name: string; avatar?: string; orders: number; revenue: number } } = {}
  
  completedOrders.forEach(order => {
    // Use served_by, assigned_to, or accepted_by
    const waiterId = order.served_by || order.assigned_to || order.accepted_by
    if (!waiterId) return
    
    if (!waiterStats[waiterId]) {
      const member = teamMembers?.find(m => m.user_id === waiterId)
      const profile = member?.profiles as any
      waiterStats[waiterId] = {
        id: waiterId,
        name: profile?.full_name || 'Unknown',
        avatar: profile?.avatar_url,
        orders: 0,
        revenue: 0
      }
    }
    waiterStats[waiterId].orders += 1
    waiterStats[waiterId].revenue += order.total || 0
  })

  const topWaiters = Object.values(waiterStats)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)

  // 5. Order types distribution
  const orderTypeStats = {
    dine_in: 0,
    takeaway: 0,
    delivery: 0
  }
  
  orders?.forEach(order => {
    const type = order.type as keyof typeof orderTypeStats
    if (orderTypeStats[type] !== undefined) {
      orderTypeStats[type] += 1
    }
  })

  const orderTypesChart = [
    { name: 'Dine In', value: orderTypeStats.dine_in, color: '#22c55e' },
    { name: 'Takeaway', value: orderTypeStats.takeaway, color: '#3b82f6' },
    { name: 'Delivery', value: orderTypeStats.delivery, color: '#f59e0b' }
  ].filter(t => t.value > 0)

  // 6. Peak hours analysis
  const hourlyStats: { [key: number]: number } = {}
  
  orders?.forEach(order => {
    const hour = new Date(order.created_at).getHours()
    hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
  })

  const peakHoursChart = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    orders: hourlyStats[i] || 0
  }))

  // 7. Order status distribution
  const statusStats: { [key: string]: number } = {}
  orders?.forEach(order => {
    statusStats[order.status] = (statusStats[order.status] || 0) + 1
  })

  // Calculate comparison with previous period
  let previousStartDate: Date
  let previousEndDate: Date
  
  switch (timeframe) {
    case 'day':
      // Previous day
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
      previousEndDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'month':
      // Previous month
      previousStartDate = new Date(year, month - 1, 1, 0, 0, 0)
      previousEndDate = new Date(year, month, 0, 23, 59, 59, 999)
      break
    case 'year':
      // Previous year
      previousStartDate = new Date(year - 1, 0, 1, 0, 0, 0)
      previousEndDate = new Date(year - 1, 11, 31, 23, 59, 59, 999)
      break
    default:
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
      previousEndDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)
  }
  
  const { data: previousOrders } = await supabase
    .from('orders')
    .select('total, status')
    .eq('tenant_id', tenantUser.tenant_id)
    .gte('created_at', previousStartDate.toISOString())
    .lte('created_at', previousEndDate.toISOString())

  const previousCompletedOrders = previousOrders?.filter(o => 
    ['completed', 'served', 'paid'].includes(o.status)
  ) || []
  const previousEarnings = previousCompletedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const previousOrderCount = previousOrders?.length || 0

  const earningsChange = previousEarnings > 0 
    ? ((totalEarnings - previousEarnings) / previousEarnings * 100).toFixed(1)
    : totalEarnings > 0 ? '+100' : '0'
  
  const ordersChange = previousOrderCount > 0
    ? ((totalOrders - previousOrderCount) / previousOrderCount * 100).toFixed(1)
    : totalOrders > 0 ? '+100' : '0'

  return NextResponse.json({
    data: {
      summary: {
        totalEarnings,
        totalOrders,
        completedOrders: completedOrders.length,
        avgOrderValue,
        earningsChange: parseFloat(earningsChange as string),
        ordersChange: parseFloat(ordersChange as string)
      },
      earningsChart,
      topProducts,
      topWaiters,
      orderTypesChart,
      peakHoursChart,
      statusStats,
      timeframe
    }
  })
}
