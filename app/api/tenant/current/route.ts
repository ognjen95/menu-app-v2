import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant } from '@/lib/api/route-handlers'

export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    // Get tenant details
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      throw new Error(tenantError.message)
    }

    // Get user's role in this tenant
    const { data: tenantUser, error: userError } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (userError) {
      throw new Error(userError.message)
    }

    // Get tenant's locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (locationsError) {
      throw new Error(locationsError.message)
    }

    return {
      tenant,
      user: tenantUser,
      locations: locations || [],
    }
  })
}

export async function PUT(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    const data = body as Record<string, unknown>

    // Verify user has owner/manager role
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'manager'].includes(tenantUser.role)) {
      throw new Error('You do not have permission to update tenant settings')
    }

    // Build update object with only allowed fields
    const allowedFields = [
      'name', 'email', 'phone', 'timezone', 'default_currency', 
      'vat_rate', 'settings', 'logo_url', 'description'
    ]
    
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
      }
    }

    // If settings is being updated, merge with existing settings
    if (data.settings) {
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenantId)
        .single()

      updateData.settings = {
        ...(currentTenant?.settings as Record<string, unknown> || {}),
        ...(data.settings as Record<string, unknown>),
      }
    }

    updateData.updated_at = new Date().toISOString()

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { tenant }
  })
}
