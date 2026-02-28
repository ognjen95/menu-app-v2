import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getSeedDataForType } from '@/lib/seed-data'
import { seedTenantData } from '@/lib/services/seed-data.service'
import type { TenantType } from '@/lib/types'

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
    const { 
      name, 
      slug, 
      type, 
      email, 
      phone, 
      country, 
      location,
      workingHours,
      languages = ['en'],
      defaultLanguage = 'en',
      seedData = false
    } = body

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
    let menuId: string | null = null
    console.log('Location data received:', location)
    console.log('seedData flag:', seedData)
    
    if (location) {
      const { data: locationData, error: locationError } = await supabaseAdmin
        .from('locations')
        .insert({
          tenant_id: tenant.id,
          name: location.address || location.name || 'Main Location',
          slug: 'main',
          address: location.address,
          city: location.city,
          country: location.country || country || 'RS',
          is_active: true,
          service_modes: ['dine_in'],
          opening_hours: workingHours || null,
        })
        .select()
        .single()

      if (locationError) {
        console.error('Location creation error:', locationError)
      }
      
      if (!locationError && locationData) {
        console.log('Location created:', locationData.id)
        // Create a default menu (or use seed data menu name)
        const seedInfo = seedData ? getSeedDataForType(type as TenantType) : null
        const { data: menuData, error: menuError } = await supabaseAdmin
          .from('menus')
          .insert({
            tenant_id: tenant.id,
            location_id: locationData.id,
            name: seedInfo?.menuName || 'Main Menu',
            is_active: true,
            available_days: [0, 1, 2, 3, 4, 5, 6],
          })
          .select()
          .single()

        if (menuError) {
          console.error('Menu creation error:', menuError)
        }
        if (menuData) {
          menuId = menuData.id
          console.log('Menu created:', menuId)
        }

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

    // Set tenant languages
    const languageInserts = languages.map((langCode: string) => ({
      tenant_id: tenant.id,
      language_code: langCode,
      is_default: langCode === defaultLanguage,
      is_enabled: true,
    }))
    await supabaseAdmin.from('tenant_languages').insert(languageInserts)

    // Seed initial data if requested
    if (seedData && menuId) {
      console.log('Seeding data for type:', type, 'menuId:', menuId)
      
      const seedResult = await seedTenantData(tenant.id, menuId, type as TenantType)
      
      if (seedResult.success) {
        console.log('Seed data created:', {
          categories: seedResult.categories.length,
          menuItems: seedResult.menuItems.length,
          variantCategories: seedResult.variantCategories.length,
          variants: seedResult.variants.length,
        })
      } else {
        console.error('Seed data errors:', seedResult.errors)
      }
    } else {
      console.log('Skipping seed data: seedData=', seedData, 'menuId=', menuId)
    }

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
