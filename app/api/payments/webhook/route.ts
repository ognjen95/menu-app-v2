import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log the webhook
  await supabaseAdmin.from('webhook_logs').insert({
    provider: 'stripe',
    event_type: event.type,
    event_id: event.id,
    payload: event.data.object,
    processed_at: new Date().toISOString(),
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get order ID from metadata
        const orderId = session.metadata?.order_id
        if (!orderId) {
          console.error('No order_id in session metadata')
          break
        }

        // Update order status to placed (payment successful)
        const { error: orderError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'placed',
            placed_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (orderError) {
          console.error('Error updating order:', orderError)
          throw new Error(orderError.message)
        }

        // Create payment record
        await supabaseAdmin.from('order_payments').insert({
          order_id: orderId,
          tenant_id: session.metadata?.tenant_id,
          provider: 'stripe',
          status: 'paid',
          amount: (session.amount_total || 0) / 100, // Convert from cents
          currency: session.currency?.toUpperCase() || 'EUR',
          provider_payment_id: session.payment_intent as string,
          provider_data: {
            session_id: session.id,
            payment_intent: session.payment_intent,
            payment_status: session.payment_status,
          },
          paid_at: new Date().toISOString(),
        })

        console.log(`Order ${orderId} payment completed`)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        
        if (orderId) {
          // Mark order as cancelled if session expired without payment
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancellation_reason: 'Payment session expired',
            })
            .eq('id', orderId)
            .eq('status', 'draft') // Only if still in draft
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Log the failure
        console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message)
        
        // Update any associated payment record
        await supabaseAdmin
          .from('order_payments')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
          })
          .eq('provider_payment_id', paymentIntent.id)
        
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        
        // Update payment record
        await supabaseAdmin
          .from('order_payments')
          .update({
            status: charge.amount_refunded === charge.amount ? 'refunded' : 'partially_refunded',
            refunded_at: new Date().toISOString(),
            refund_amount: charge.amount_refunded / 100,
          })
          .eq('provider_payment_id', charge.payment_intent as string)
        
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Update webhook log with success
    await supabaseAdmin
      .from('webhook_logs')
      .update({ response_status: 200 })
      .eq('event_id', event.id)

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Update webhook log with error
    await supabaseAdmin
      .from('webhook_logs')
      .update({ 
        response_status: 500,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('event_id', event.id)

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
