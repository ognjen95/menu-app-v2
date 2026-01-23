import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for public orders (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create public order (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const orderData = body as {
      tenant_id: string
      location_id: string
      table_id?: string
      type: 'dine_in' | 'takeaway' | 'delivery'
      customer_name?: string
      customer_phone?: string
      customer_email?: string
      customer_notes?: string
      payment_method: 'online' | 'cash' | 'card_pos'
      items: {
        menu_item_id: string
        variant_id?: string
        quantity: number
        selected_options?: { option_id: string; name: string; price: number }[]
        notes?: string
      }[]
    }

    // Validate required fields
    if (!orderData.tenant_id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }
    if (!orderData.location_id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 })
    }
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 })
    }

    // Verify tenant exists and is active
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, vat_rate, default_currency, subscription_status')
      .eq('id', orderData.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    if (tenant.subscription_status !== 'active' && tenant.subscription_status !== 'trialing') {
      return NextResponse.json({ error: 'Restaurant is not accepting orders' }, { status: 403 })
    }

    // Verify location belongs to tenant
    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .select('id, name, is_active')
      .eq('id', orderData.location_id)
      .eq('tenant_id', orderData.tenant_id)
      .single()

    if (locationError || !location || !location.is_active) {
      return NextResponse.json({ error: 'Location not found or inactive' }, { status: 404 })
    }

    // Generate unique session ID for this order
    const sessionId = crypto.randomUUID()

    // Calculate order totals
    let subtotal = 0
    const orderItems: {
      menu_item_id: string
      variant_id?: string
      item_name: string
      variant_name: string | null
      quantity: number
      unit_price: number
      options_price: number
      total_price: number
      selected_options: { option_id: string; name: string; price: number }[]
      notes?: string
    }[] = []

    for (const item of orderData.items) {
      // Get menu item details
      const { data: menuItem } = await supabaseAdmin
        .from('menu_items')
        .select('id, name, base_price, is_active, is_sold_out')
        .eq('id', item.menu_item_id)
        .eq('tenant_id', orderData.tenant_id)
        .single()

      if (!menuItem || !menuItem.is_active || menuItem.is_sold_out) {
        return NextResponse.json({ 
          error: `Item "${menuItem?.name || item.menu_item_id}" is not available` 
        }, { status: 400 })
      }

      // Get variant if specified
      let variantName = null
      let variantPrice = 0
      if (item.variant_id) {
        const { data: variant } = await supabaseAdmin
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
      const optionsPrice = (item.selected_options || []).reduce((sum, opt) => sum + (opt.price || 0), 0)
      const unitPrice = menuItem.base_price + variantPrice
      const totalPrice = (unitPrice + optionsPrice) * item.quantity
      
      subtotal += totalPrice

      orderItems.push({
        menu_item_id: item.menu_item_id,
        variant_id: item.variant_id,
        item_name: menuItem.name,
        variant_name: variantName,
        quantity: item.quantity,
        unit_price: unitPrice,
        options_price: optionsPrice,
        total_price: totalPrice,
        selected_options: item.selected_options || [],
        notes: item.notes,
      })
    }

    // Calculate tax
    const taxRate = tenant.vat_rate || 0
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    // Determine initial status based on payment method
    const initialStatus = orderData.payment_method === 'online' ? 'draft' : 'placed'

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        tenant_id: orderData.tenant_id,
        location_id: orderData.location_id,
        table_id: orderData.table_id,
        type: orderData.type || 'dine_in',
        status: initialStatus,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        customer_notes: orderData.customer_notes,
        session_id: sessionId,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        currency: tenant.default_currency || 'EUR',
        placed_at: orderData.payment_method !== 'online' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Insert order items
    const itemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      ...item,
    }))

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Order items error:', itemsError)
      // Rollback order
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // If payment method is online, we'll need to create a payment session
    // This will be handled by a separate endpoint when Stripe is integrated
    let paymentUrl = null
    if (orderData.payment_method === 'online') {
      // TODO: Create Stripe checkout session
      // For now, mark as pending payment
      paymentUrl = `/checkout/${order.id}?session=${sessionId}`
    }

    return NextResponse.json({
      data: {
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total,
          currency: order.currency,
        },
        payment_url: paymentUrl,
        message: orderData.payment_method === 'online' 
          ? 'Order created. Proceed to payment.' 
          : 'Order placed successfully!',
      }
    })

  } catch (error) {
    console.error('Public order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get order status by session ID (for customers to track their order)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const orderId = searchParams.get('order_id')

    if (!sessionId && !orderId) {
      return NextResponse.json({ error: 'Session ID or Order ID required' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        type,
        subtotal,
        tax_amount,
        total,
        currency,
        placed_at,
        estimated_ready_at,
        items:order_items(
          item_name,
          variant_name,
          quantity,
          total_price,
          selected_options
        )
      `)

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else if (orderId) {
      query = query.eq('id', orderId)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ data: { order } })

  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
