import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - Get website for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    const { data: website, error } = await supabase
      .from('websites')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return { website: website || null }
  })
}

// PATCH - Update website settings
export async function PATCH(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const updateData = body as {
      subdomain?: string
      custom_domain?: string
      is_published?: boolean
      theme_id?: string
      primary_color?: string
      secondary_color?: string
      background_color?: string
      foreground_color?: string
      accent_color?: string
      font_heading?: string
      font_body?: string
      logo_url?: string
      favicon_url?: string
      seo_title?: string
      seo_description?: string
      seo_image_url?: string
      social_links?: Record<string, string>
      settings?: Record<string, unknown>
    }

    // If subdomain is being updated, check availability first
    if (updateData.subdomain) {
      // Check if slug is already taken by another tenant
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', updateData.subdomain)
        .neq('id', tenantId)
        .single()

      if (existingTenant) {
        throw new Error('This subdomain is already taken. Please choose another one.')
      }

      // Check if subdomain is already taken by another website
      const { data: existingWebsite } = await supabase
        .from('websites')
        .select('id')
        .eq('subdomain', updateData.subdomain)
        .neq('tenant_id', tenantId)
        .single()

      if (existingWebsite) {
        throw new Error('This subdomain is already taken. Please choose another one.')
      }

      // Update tenant slug first (to keep them in sync)
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ slug: updateData.subdomain })
        .eq('id', tenantId)

      if (tenantError) throw new Error(`Failed to update tenant slug: ${tenantError.message}`)
    }

    // Check if website exists
    const { data: existing } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    let website
    if (!existing) {
      // Create website if it doesn't exist
      const { data, error } = await supabase
        .from('websites')
        .insert({ tenant_id: tenantId, ...updateData })
        .select()
        .single()

      if (error) throw new Error(error.message)
      website = data
    } else {
      // Update existing website
      const { data, error } = await supabase
        .from('websites')
        .update(updateData)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      website = data
    }

    return { website }
  })
}
