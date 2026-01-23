import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

// Service role client for bypassing RLS during tenant creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create new tenant (during onboarding)
export async function POST(request: NextRequest) {
  try {
    // Use regular client for auth check
    const supabase = await createServerSupabaseClient(request)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a tenant (use admin client to bypass RLS)
    const { data: existingTenant } = await supabaseAdmin
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (existingTenant) {
      return NextResponse.json({ error: 'User already belongs to a business' }, { status: 400 })
    }

    const body = await request.json()
    const { name, slug, type, email, phone, country, location } = body

    if (!name || !slug || !type) {
      return NextResponse.json({ error: 'Name, slug, and type are required' }, { status: 400 })
    }

    // Check slug availability (use admin client)
    const { data: slugCheck } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (slugCheck) {
      return NextResponse.json({ error: 'This URL is already taken. Please choose another.' }, { status: 400 })
    }

    // Create tenant (use admin client to bypass RLS)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
        type,
        email: email || user.email,
        phone,
        country: country || 'RS',
        plan: 'basic',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Tenant creation error:', tenantError)
      return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
    }

    // Add user as owner (use admin client)
    const { error: userError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
        is_active: true,
        joined_at: new Date().toISOString(),
      })

    if (userError) {
      console.error('User assignment error:', userError)
      // Rollback tenant creation
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      return NextResponse.json({ error: 'Failed to assign user to business' }, { status: 500 })
    }

    // Create default location if provided (use admin client)
    if (location) {
      const { data: locationData, error: locationError } = await supabaseAdmin
        .from('locations')
        .insert({
          tenant_id: tenant.id,
          name: location.name || 'Main Location',
          slug: 'main',
          address: location.address,
          city: location.city,
          country: location.country || country || 'RS',
          is_active: true,
          service_modes: ['dine_in'],
        })
        .select()
        .single()

      if (!locationError && locationData) {
        // Create a default menu
        await supabaseAdmin
          .from('menus')
          .insert({
            tenant_id: tenant.id,
            location_id: locationData.id,
            name: 'Main Menu',
            is_active: true,
            available_days: [0, 1, 2, 3, 4, 5, 6],
          })

        // Generate a QR code for the location
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        await supabaseAdmin.from('qr_codes').insert({
          tenant_id: tenant.id,
          location_id: locationData.id,
          type: 'menu',
          url: `${baseUrl}/m/${slug}`,
        })
      }
    }

    // Set default language (English)
    await supabaseAdmin.from('tenant_languages').insert({
      tenant_id: tenant.id,
      language_code: 'en',
      is_default: true,
      is_enabled: true,
    })

    // Create website placeholder
    await supabaseAdmin.from('websites').insert({
      tenant_id: tenant.id,
      subdomain: slug,
      is_published: false,
    })

    return NextResponse.json({ 
      data: { 
        tenant: { id: tenant.id, slug: tenant.slug } 
      } 
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
