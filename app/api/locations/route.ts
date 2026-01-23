import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List locations for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { locations: locations || [] }
  })
}

// POST - Create new location
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const locationData = body as {
      name: string
      slug?: string
      address?: string
      city?: string
      postal_code?: string
      country?: string
      phone?: string
      email?: string
      service_modes?: string[]
      opening_hours?: Record<string, unknown>
    }

    if (!locationData.name) {
      throw new Error('Location name is required')
    }

    // Generate slug if not provided
    const slug = locationData.slug || locationData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        tenant_id: tenantId,
        name: locationData.name,
        slug,
        address: locationData.address,
        city: locationData.city,
        postal_code: locationData.postal_code,
        country: locationData.country || 'RS',
        phone: locationData.phone,
        email: locationData.email,
        service_modes: locationData.service_modes || ['dine_in'],
        opening_hours: locationData.opening_hours,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { location }
  })
}
