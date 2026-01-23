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
        category:categories(id, name)
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
