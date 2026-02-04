import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ itemId: string }> }

// GET - List variants for a menu item
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { itemId } = await params

    const { data: variants, error } = await supabase
      .from('menu_item_variants')
      .select(`
        *,
        category:variant_categories(*)
      `)
      .eq('menu_item_id', itemId)
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { variants: variants || [] }
  })
}

// POST - Create new variant for a menu item
export async function POST(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { itemId } = await params

    const variantData = body as {
      category_id: string
      name: string
      price_adjustment?: number
      is_default?: boolean
    }

    if (!variantData.name || !variantData.category_id) {
      throw new Error('Variant name and category are required')
    }

    // Get max sort_order for this item and category
    const { data: maxOrder } = await supabase
      .from('menu_item_variants')
      .select('sort_order')
      .eq('menu_item_id', itemId)
      .eq('category_id', variantData.category_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    // If this is default, unset other defaults in same category
    if (variantData.is_default) {
      await supabase
        .from('menu_item_variants')
        .update({ is_default: false })
        .eq('menu_item_id', itemId)
        .eq('category_id', variantData.category_id)
    }

    const { data: variant, error } = await supabase
      .from('menu_item_variants')
      .insert({
        tenant_id: tenantId,
        menu_item_id: itemId,
        category_id: variantData.category_id,
        name: variantData.name,
        price_adjustment: variantData.price_adjustment ?? 0,
        is_default: variantData.is_default ?? false,
        sort_order: (maxOrder?.sort_order || 0) + 1,
      })
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
