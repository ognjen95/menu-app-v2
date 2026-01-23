import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createStripeCustomer } from '@/lib/stripe'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createServerSupabaseClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (user) {
                // Check if user has a tenant (business) yet
                const { data: tenantUser } = await supabase
                    .from('tenant_users')
                    .select('tenant_id')
                    .eq('user_id', user.id)
                    .single()

                // If user doesn't have a Stripe customer ID, create one
                if (!user.user_metadata?.stripe_customer_id) {
                    try {
                        const stripeID = await createStripeCustomer(user.id, user.email!, user.user_metadata?.full_name)
                        await supabase.auth.updateUser({
                            data: { stripe_customer_id: stripeID }
                        })
                    } catch (err) {
                        console.error('Error creating Stripe customer:', err)
                    }
                }

                // Redirect to onboarding if no tenant, otherwise to dashboard
                const redirectPath = tenantUser ? '/dashboard' : '/onboarding'
                
                const forwardedHost = request.headers.get('x-forwarded-host')
                const isLocalEnv = process.env.NODE_ENV === 'development'
                
                if (isLocalEnv) {
                    return NextResponse.redirect(`${origin}${redirectPath}`)
                } else if (forwardedHost) {
                    return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
                } else {
                    return NextResponse.redirect(`${origin}${redirectPath}`)
                }
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}