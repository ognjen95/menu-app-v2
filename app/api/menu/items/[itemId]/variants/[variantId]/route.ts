import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ itemId: string; variantId: string }> }

// PATCH - Update variant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { itemId, variantId } = await params

    const updateData = body as {
      name?: string
      price_adjustment?: number
      is_default?: boolean
      is_available?: boolean
      sort_order?: number
    }

    // If setting as default, unset other defaults in same category
    if (updateData.is_default) {
      const { data: currentVariant } = await supabase
        .from('menu_item_variants')
        .select('category_id')
        .eq('id', variantId)
        .single()

      if (currentVariant) {
        await supabase
          .from('menu_item_variants')
          .update({ is_default: false })
          .eq('menu_item_id', itemId)
          .eq('category_id', currentVariant.category_id)
          .neq('id', variantId)
      }
    }

    const { data: variant, error } = await supabase
      .from('menu_item_variants')
      .update(updateData)
      .eq('id', variantId)
      .eq('menu_item_id', itemId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        category:variant_categories(*)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { variant }
  })
}

// DELETE - Delete variant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { itemId, variantId } = await params

    const { error } = await supabase
      .from('menu_item_variants')
      .delete()
      .eq('id', variantId)
      .eq('menu_item_id', itemId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
