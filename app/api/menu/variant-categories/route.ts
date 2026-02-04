import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List variant categories for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    const { data: categories, error } = await supabase
      .from('variant_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { categories: categories || [] }
  })
}

// POST - Create new variant category
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const categoryData = body as {
      name: string
      description?: string
      is_required?: boolean
      allow_multiple?: boolean
    }

    if (!categoryData.name) {
      throw new Error('Category name is required')
    }

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('variant_categories')
      .select('sort_order')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const { data: category, error } = await supabase
      .from('variant_categories')
      .insert({
        tenant_id: tenantId,
        name: categoryData.name,
        description: categoryData.description,
        is_required: categoryData.is_required ?? false,
        allow_multiple: categoryData.allow_multiple ?? false,
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
