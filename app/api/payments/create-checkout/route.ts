import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Create Supabase admin client for public payments
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create Stripe checkout session for order payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, session_id, success_url, cancel_url } = body as {
      order_id: string
      session_id?: string
      success_url?: string
      cancel_url?: string
    }

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        tenant_id,
        total,
        currency,
        status,
        session_id,
        customer_email,
        customer_name,
        items:order_items(
          item_name,
          quantity,
          total_price
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify session_id matches if provided
    if (session_id && order.session_id !== session_id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // Check order status
    if (order.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Order already processed or paid',
        status: order.status 
      }, { status: 400 })
    }

    // Get tenant's payment configuration
    const { data: paymentConfig } = await supabaseAdmin
      .from('payment_configs')
      .select('*')
      .eq('tenant_id', order.tenant_id)
      .eq('provider', 'stripe')
      .eq('is_enabled', true)
      .single()

    // Get tenant info for branding
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('name, stripe_customer_id')
      .eq('id', order.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    // Initialize Stripe - use platform key or tenant's connected account
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

    // Build line items from order
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items?.map((item: { item_name: string; quantity: number; total_price: number }) => ({
      price_data: {
        currency: order.currency.toLowerCase(),
        product_data: {
          name: item.item_name,
        },
        unit_amount: Math.round((item.total_price / item.quantity) * 100), // Convert to cents
      },
      quantity: item.quantity,
    })) || []

    // Create checkout session
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/order/success?order_id=${order_id}`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/order/cancel?order_id=${order_id}`,
      metadata: {
        order_id: order_id,
        tenant_id: order.tenant_id,
      },
      customer_email: order.customer_email || undefined,
    }

    // If tenant has a connected Stripe account, use it
    if (paymentConfig?.config?.stripe_account_id) {
      checkoutParams.payment_intent_data = {
        application_fee_amount: Math.round(order.total * 2), // 2% platform fee
        transfer_data: {
          destination: paymentConfig.config.stripe_account_id,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(checkoutParams)

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({ 
        stripe_session_id: session.id,
      })
      .eq('id', order_id)

    return NextResponse.json({
      data: {
        checkout_url: session.url,
        session_id: session.id,
      }
    })

  } catch (error) {
    console.error('Create checkout error:', error)
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
