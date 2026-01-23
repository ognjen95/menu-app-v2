import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ menuId: string }> }

// GET - Get single menu
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { menuId } = await params

    const { data: menu, error } = await supabase
      .from('menus')
      .select('*')
      .eq('id', menuId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { menu }
  })
}

// PUT - Update menu
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { menuId } = await params

    const menuData = body as {
      name?: string
      description?: string
      location_id?: string
      is_active?: boolean
      available_from?: string
      available_until?: string
      available_days?: number[]
      sort_order?: number
    }

    const { data: menu, error } = await supabase
      .from('menus')
      .update(menuData)
      .eq('id', menuId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { menu }
  })
}

// DELETE - Delete menu
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { menuId } = await params

    const { error } = await supabase
      .from('menus')
      .delete()
      .eq('id', menuId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
