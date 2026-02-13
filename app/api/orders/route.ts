import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'
import { OrderStatus } from '@/lib/types'

// GET - List orders with filters
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    
    const locationId = params.get('location_id')
    const status = params.get('status')
    const type = params.get('type')
    const dateFrom = params.get('date_from')
    const dateTo = params.get('date_to')
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '50')

    let query = supabase
      .from('orders')
      .select(`
        *,
        table:tables!orders_table_id_fkey(id, name, zone),
        location:locations(id, name),
        items:order_items(
          *,
          menu_item:menu_items(id, name, image_urls)
        ),
        payments:order_payments(*)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0])
      } else {
        query = query.in('status', statuses)
      }
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: orders, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      orders: orders || [],
      total: count || 0,
      page,
      limit,
    }
  })
}

// POST - Create new order
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)

    const orderData = body as {
      location_id: string
      table_id?: string
      type: string
      status?: OrderStatus
      customer_name?: string
      customer_phone?: string
      customer_email?: string
      customer_notes?: string
      items: {
        menu_item_id: string
        variant_id?: string
        quantity: number
        selected_options?: { option_id: string }[]
        notes?: string
      }[]
    }

    if (!orderData.location_id) {
      throw new Error('Location ID is required')
    }

    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('Order must have at least one item')
    }

    // Get tenant's VAT rate
    const { data: tenant } = await supabase
      .from('tenants')
      .select('vat_rate, default_currency')
      .eq('id', tenantId)
      .single()

    // Build order data with appropriate timestamps based on status
    const status = orderData.status || 'placed'
    const now = new Date().toISOString()
    
    // Map status to timestamp fields
    const statusTimestamps: Record<string, unknown> = {
      placed_at: now, // Always set placed_at
    }
    
    // Set additional timestamps and user tracking based on initial status
    if (status === 'accepted') {
      statusTimestamps.accepted_at = now
      statusTimestamps.accepted_by = user.id
    } else if (status === 'preparing') {
      statusTimestamps.accepted_at = now
      statusTimestamps.accepted_by = user.id
      statusTimestamps.preparing_at = now
      statusTimestamps.prepared_by = user.id
    } else if (status === 'ready') {
      statusTimestamps.accepted_at = now
      statusTimestamps.accepted_by = user.id
      statusTimestamps.preparing_at = now
      statusTimestamps.prepared_by = user.id
      statusTimestamps.ready_at = now
    } else if (status === 'served') {
      statusTimestamps.accepted_at = now
      statusTimestamps.accepted_by = user.id
      statusTimestamps.preparing_at = now
      statusTimestamps.prepared_by = user.id
      statusTimestamps.ready_at = now
      statusTimestamps.served_at = now
      statusTimestamps.served_by = user.id
    } else if (status === 'completed') {
      statusTimestamps.accepted_at = now
      statusTimestamps.accepted_by = user.id
      statusTimestamps.preparing_at = now
      statusTimestamps.prepared_by = user.id
      statusTimestamps.ready_at = now
      statusTimestamps.served_at = now
      statusTimestamps.served_by = user.id
      statusTimestamps.completed_at = now
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        location_id: orderData.location_id,
        table_id: orderData.table_id,
        type: orderData.type || 'dine_in',
        status,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        customer_notes: orderData.customer_notes,
        tax_rate: tenant?.vat_rate || 0,
        currency: tenant?.default_currency || 'EUR',
        ...statusTimestamps,
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(orderError.message)
    }

    // Add order items
    for (const item of orderData.items) {
      // Get menu item details
      const { data: menuItem } = await supabase
        .from('menu_items')
        .select('name, base_price')
        .eq('id', item.menu_item_id)
        .single()

      if (!menuItem) continue

      // Get variant if specified
      let variantName = null
      let variantPrice = 0
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from('item_variants')
          .select('name, price_modifier')
          .eq('id', item.variant_id)
          .single()
        
        if (variant) {
          variantName = variant.name
          variantPrice = variant.price_modifier || 0
        }
      }

      // Calculate options price
      let optionsPrice = 0
      const selectedOptions: { option_id: string; name: string; price: number }[] = []
      
      if (item.selected_options) {
        for (const opt of item.selected_options) {
          const { data: option } = await supabase
            .from('item_options')
            .select('name, price')
            .eq('id', opt.option_id)
            .single()
          
          if (option) {
            optionsPrice += option.price || 0
            selectedOptions.push({
              option_id: opt.option_id,
              name: option.name,
              price: option.price || 0,
            })
          }
        }
      }

      const unitPrice = menuItem.base_price + variantPrice
      const totalPrice = (unitPrice + optionsPrice) * item.quantity

      await supabase.from('order_items').insert({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        variant_id: item.variant_id,
        item_name: menuItem.name,
        variant_name: variantName,
        quantity: item.quantity,
        unit_price: unitPrice,
        options_price: optionsPrice,
        total_price: totalPrice,
        selected_options: selectedOptions,
        notes: item.notes,
      })
    }

    // Fetch the complete order with items
    const { data: completeOrder } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single()

    return { order: completeOrder }
  })
}
