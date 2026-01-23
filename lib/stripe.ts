import { Stripe } from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'

// Admin client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getStripePlan(tenantId: string) {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('stripe_subscription_id, plan')
    .eq('id', tenantId)
    .single()
  
  if (!tenant?.stripe_subscription_id) {
    return tenant?.plan || 'basic'
  }

  const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id)
  const productId = subscription.items.data[0].plan.product as string
  const product = await stripe.products.retrieve(productId)
  return product.name
}

export async function createStripeCustomer(id: string, email: string, name?: string) {
  const customer = await stripe.customers.create({
    name: name || '',
    email: email,
    metadata: {
      supabase_user_id: id,
    },
  })
  return customer.id
}

export async function createStripeCheckoutSession(stripeCustomerId: string) {
  const customerSession = await stripe.customerSessions.create({
    customer: stripeCustomerId,
    components: {
      pricing_table: {
        enabled: true,
      },
    },
  })
  return customerSession.client_secret
}

export async function generateStripeBillingPortalLink(stripeCustomerId: string) {
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${PUBLIC_URL}/dashboard`,
  })
  return portalSession.url
}

// Get Stripe customer ID from tenant
export async function getTenantStripeCustomer(tenantId: string) {
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', tenantId)
    .single()
  
  return tenant?.stripe_customer_id
}
