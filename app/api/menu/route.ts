import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'
import { validateMenuSchedule } from '@/lib/utils/menu-schedule'
import type { Menu } from '@/lib/types'

// GET - List menus for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    const locationId = params.get('location_id')

    let query = supabase
      .from('menus')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (locationId) {
      query = query.or(`location_id.eq.${locationId},location_id.is.null`)
    }

    const { data: menus, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { menus: menus || [] }
  })
}

// POST - Create new menu
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const menuData = body as {
      name: string
      description?: string | null
      location_id?: string | null
      is_active?: boolean
      available_from?: string | null
      available_until?: string | null
      available_days?: number[]
    }

    if (!menuData.name) {
      throw new Error('Menu name is required')
    }

    // Fetch existing menus to check for schedule overlaps
    const { data: existingMenus } = await supabase
      .from('menus')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    // Validate schedule doesn't overlap with existing menus
    validateMenuSchedule(existingMenus as Menu[] || [], menuData)

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('menus')
      .select('sort_order')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data: menu, error } = await supabase
      .from('menus')
      .insert({
        tenant_id: tenantId,
        name: menuData.name,
        description: menuData.description || null,
        location_id: menuData.location_id || null,
        is_active: menuData.is_active ?? true,
        available_from: menuData.available_from || null,
        available_until: menuData.available_until || null,
        available_days: menuData.available_days || [0, 1, 2, 3, 4, 5, 6],
        sort_order: (maxOrder?.sort_order || 0) + 1,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { menu }
  })
}
