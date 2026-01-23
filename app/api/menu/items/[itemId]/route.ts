import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ itemId: string }> }

// GET - Get single menu item with all relations
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { itemId } = await params

    const { data: item, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:categories(id, name, menu_id),
        variants:item_variants(*),
        option_groups(
          *,
          options:item_options(*)
        ),
        item_allergens(
          allergen_id,
          allergens(id, code, name, icon)
        )
      `)
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Transform allergens from nested structure
    const allergens = item.item_allergens?.map((ia: { allergens: unknown }) => ia.allergens) || []

    return {
      item: {
        ...item,
        allergens,
        item_allergens: undefined,
      },
    }
  })
}

// PUT - Update menu item
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { itemId } = await params

    const itemData = body as {
      name?: string
      description?: string
      base_price?: number
      compare_price?: number
      image_urls?: string[]
      is_active?: boolean
      is_featured?: boolean
      is_new?: boolean
      is_sold_out?: boolean
      preparation_time?: number
      calories?: number
      dietary_tags?: string[]
      sort_order?: number
      allergen_ids?: string[]
    }

    // Extract allergen_ids before updating item
    const { allergen_ids, ...updateData } = itemData

    const { data: item, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update allergens if provided
    if (allergen_ids !== undefined) {
      // Remove existing allergens
      await supabase.from('item_allergens').delete().eq('item_id', itemId)

      // Add new allergens
      if (allergen_ids.length > 0) {
        const allergenInserts = allergen_ids.map(allergenId => ({
          item_id: itemId,
          allergen_id: allergenId,
        }))

        await supabase.from('item_allergens').insert(allergenInserts)
      }
    }

    return { item }
  })
}

// DELETE - Delete menu item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { itemId } = await params

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
