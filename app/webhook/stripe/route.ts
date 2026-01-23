import { db } from '@/lib/db'
import { usersTable } from '@/lib/schema'
import { stripe } from '@/lib/stripe'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

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
        console.log('Subscription created:', event.id)
        await db
          .update(usersTable)
          .set({ plan: event.data.object.id })
          .where(eq(usersTable.stripe_id, event.data.object.customer as string))
        break

      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.id)
        await db
          .update(usersTable)
          .set({ plan: event.data.object.id })
          .where(eq(usersTable.stripe_id, event.data.object.customer as string))
        break

      case 'customer.subscription.deleted':
        console.log('Subscription deleted:', event.id)
        await db
          .update(usersTable)
          .set({ plan: 'none' })
          .where(eq(usersTable.stripe_id, event.data.object.customer as string))
        break

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