import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ menuId: string }> }

// GET - List categories for a menu
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { menuId } = await params

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('menu_id', menuId)
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { categories: categories || [] }
  })
}

// POST - Create new category
export async function POST(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { menuId } = await params

    const categoryData = body as {
      name: string
      description?: string
      image_url?: string
      icon?: string
      is_active?: boolean
    }

    if (!categoryData.name) {
      throw new Error('Category name is required')
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('menu_id', menuId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        menu_id: menuId,
        tenant_id: tenantId,
        name: categoryData.name,
        description: categoryData.description,
        image_url: categoryData.image_url,
        icon: categoryData.icon,
        is_active: categoryData.is_active ?? true,
        sort_order: (maxOrder?.sort_order || 0) + 1,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { category }
  })
}
