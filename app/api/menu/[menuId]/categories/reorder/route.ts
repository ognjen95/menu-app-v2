import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ menuId: string }> }

// PUT - Reorder categories
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { menuId } = await params

    const { categoryIds } = body as { categoryIds: string[] }

    if (!categoryIds || !Array.isArray(categoryIds)) {
      throw new Error('categoryIds array is required')
    }

    // Update sort_order for each category
    const updates = categoryIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('menu_id', menuId)
        .eq('tenant_id', tenantId)
    )

    await Promise.all(updates)

    return { success: true }
  })
}
