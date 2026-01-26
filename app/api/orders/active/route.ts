import { NextRequest } from 'next/server'
import { queryHandler, requireTenant } from '@/lib/api/route-handlers'

// GET - List active orders (not completed or cancelled)
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    const locationId = params.get('location_id')

    // Fetch orders first
    let query = supabase
      .from('orders')
      .select(`
        *,
        table:tables!orders_table_id_fkey(id, name, zone),
        location:locations(id, name),
        items:order_items(
          *,
          menu_item:menu_items(id, name)
        )
      `)
      .eq('tenant_id', tenantId)
      .in('status', ['placed', 'accepted', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data: orders, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      orders: orders || [],
      total: orders?.length || 0,
      page: 1,
      limit: 100,
    }
  })
}
