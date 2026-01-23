import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ categoryId: string }> }

// GET - List items in a category
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { categoryId } = await params

    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        item_allergens (
          allergen_id,
          allergens (id, code, name, icon)
        )
      `)
      .eq('category_id', categoryId)
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { items: items || [] }
  })
}

// POST - Create new menu item
export async function POST(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    const itemData = body as {
      name: string
      description?: string
      base_price: number
      compare_price?: number
      image_urls?: string[]
      is_active?: boolean
      is_featured?: boolean
      is_new?: boolean
      preparation_time?: number
      calories?: number
      dietary_tags?: string[]
      allergen_ids?: string[]
    }

    if (!itemData.name) {
      throw new Error('Item name is required')
    }

    if (itemData.base_price === undefined || itemData.base_price < 0) {
      throw new Error('Valid base price is required')
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('menu_items')
      .select('sort_order')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    // Create the item
    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        category_id: categoryId,
        tenant_id: tenantId,
        name: itemData.name,
        description: itemData.description,
        base_price: itemData.base_price,
        compare_price: itemData.compare_price,
        image_urls: itemData.image_urls || [],
        is_active: itemData.is_active ?? true,
        is_featured: itemData.is_featured ?? false,
        is_new: itemData.is_new ?? false,
        preparation_time: itemData.preparation_time,
        calories: itemData.calories,
        dietary_tags: itemData.dietary_tags || [],
        sort_order: (maxOrder?.sort_order || 0) + 1,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Add allergens if provided
    if (itemData.allergen_ids && itemData.allergen_ids.length > 0) {
      const allergenInserts = itemData.allergen_ids.map(allergenId => ({
        item_id: item.id,
        allergen_id: allergenId,
      }))

      await supabase.from('item_allergens').insert(allergenInserts)
    }

    return { item }
  })
}
