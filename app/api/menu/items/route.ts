import { NextRequest } from 'next/server'
import { queryHandler, requireTenant } from '@/lib/api/route-handlers'

// GET - List all menu items for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        base_price,
        image_urls,
        is_active,
        is_featured,
        is_sold_out,
        category:categories(id, name),
        menu_item_variants(
          id,
          name,
          price_adjustment,
          is_default,
          is_available,
          category_id,
          category:variant_categories(
            id,
            name,
            description,
            is_required,
            allow_multiple
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      throw new Error(error.message)
    }

    return { items: items || [] }
  })
}
