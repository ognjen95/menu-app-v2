import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ categoryId: string }> }

// PUT - Reorder menu items within a category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    const { itemIds } = body as { itemIds: string[] }

    if (!itemIds || !Array.isArray(itemIds)) {
      throw new Error('itemIds array is required')
    }

    // Update sort_order for each item
    const updates = itemIds.map((id, index) =>
      supabase
        .from('menu_items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('category_id', categoryId)
        .eq('tenant_id', tenantId)
    )

    await Promise.all(updates)

    return { success: true }
  })
}
