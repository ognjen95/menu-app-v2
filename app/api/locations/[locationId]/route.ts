import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteContext = {
  params: Promise<{ locationId: string }>
}

// GET - Get single location
export async function GET(request: NextRequest, context: RouteContext) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { locationId } = await context.params

    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error('Location not found')
    }

    return { location }
  })
}

// PATCH - Update location
export async function PATCH(request: NextRequest, context: RouteContext) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { locationId } = await context.params

    const updateData = body as {
      name?: string
      address?: string
      city?: string
      postal_code?: string
      country?: string
      phone?: string
      email?: string
      is_active?: boolean
      service_modes?: string[]
      opening_hours?: Record<string, unknown>
    }

    const { data: location, error } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', locationId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { location }
  })
}

// DELETE - Delete location
export async function DELETE(request: NextRequest, context: RouteContext) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { locationId } = await context.params

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
