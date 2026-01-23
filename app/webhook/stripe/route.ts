import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Use service role client for webhook (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return new Response('No signature provided', { status: 400 })
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as { 
          id: string
          customer: string
          status: string
          items?: { data: { price?: { id: string } }[] }
        }
        const customerId = subscription.customer
        
        if (event.type === 'customer.subscription.deleted') {
          console.log('Subscription deleted:', event.id)
          await supabaseAdmin
            .from('tenants')
            .update({ 
              subscription_status: 'cancelled',
              plan: 'basic'
            })
            .eq('stripe_customer_id', customerId)
        } else {
          console.log(`Subscription ${event.type === 'customer.subscription.created' ? 'created' : 'updated'}:`, event.id)
          await supabaseAdmin
            .from('tenants')
            .update({ 
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
              plan: getPlanFromPrice(subscription.items?.data[0]?.price?.id)
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.id)
        break

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { customer: string }
        console.log('Payment failed:', event.id)
        await supabaseAdmin
          .from('tenants')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Success', { status: 200 })
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      `Webhook error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { status: 400 }
    )
  }
}

// Helper to map Stripe price ID to plan name
function getPlanFromPrice(priceId?: string): string {
  const priceMap: Record<string, string> = {
    'price_1Ssi3OHiAr1sa2neKVkkMkUk': 'basic',  // Basic Plan €5
    'price_1Ssi5iHiAr1sa2neiDd95ff6': 'pro',    // Pro Plan €15
  }
  return priceMap[priceId || ''] || 'basic'
}