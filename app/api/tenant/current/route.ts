import { NextRequest } from 'next/server'
import { queryHandler, requireTenant } from '@/lib/api/route-handlers'

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
