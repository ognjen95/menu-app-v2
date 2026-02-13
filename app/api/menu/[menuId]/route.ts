import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'
import { validateMenuSchedule } from '@/lib/utils/menu-schedule'
import type { Menu } from '@/lib/types'

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
      description?: string | null
      location_id?: string | null
      is_active?: boolean
      available_from?: string | null
      available_until?: string | null
      available_days?: number[]
      sort_order?: number
    }

    // Fetch current menu to merge with updates for validation
    const { data: currentMenu } = await supabase
      .from('menus')
      .select('*')
      .eq('id', menuId)
      .eq('tenant_id', tenantId)
      .single()

    if (!currentMenu) {
      throw new Error('Menu not found')
    }

    // Merge current menu with updates for validation
    const mergedData = {
      is_active: menuData.is_active ?? currentMenu.is_active,
      available_days: menuData.available_days ?? currentMenu.available_days ?? [0, 1, 2, 3, 4, 5, 6],
      available_from: 'available_from' in menuData ? menuData.available_from : currentMenu.available_from,
      available_until: 'available_until' in menuData ? menuData.available_until : currentMenu.available_until,
      location_id: 'location_id' in menuData ? menuData.location_id : currentMenu.location_id,
    }

    // Only validate if menu is/will be active
    if (mergedData.is_active) {
      // Fetch other menus to check for schedule overlaps
      const { data: existingMenus } = await supabase
        .from('menus')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .neq('id', menuId)

      validateMenuSchedule(existingMenus as Menu[] || [], mergedData, menuId)
    }

    // Build update object with explicit null handling
    const updateData: Record<string, unknown> = {}
    
    if (menuData.name !== undefined) updateData.name = menuData.name
    if ('description' in menuData) updateData.description = menuData.description
    if ('location_id' in menuData) updateData.location_id = menuData.location_id
    if (menuData.is_active !== undefined) updateData.is_active = menuData.is_active
    if ('available_from' in menuData) updateData.available_from = menuData.available_from
    if ('available_until' in menuData) updateData.available_until = menuData.available_until
    if (menuData.available_days !== undefined) updateData.available_days = menuData.available_days
    if (menuData.sort_order !== undefined) updateData.sort_order = menuData.sort_order

    const { data: menu, error } = await supabase
      .from('menus')
      .update(updateData)
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
