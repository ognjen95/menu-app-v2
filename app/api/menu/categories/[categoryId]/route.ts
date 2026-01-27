import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ categoryId: string }> }

// GET - Fetch single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { categoryId } = await params

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { category }
  })
}

// PUT - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    const categoryData = body as {
      name?: string
      description?: string
      image_url?: string
      icon?: string
      is_active?: boolean
      sort_order?: number
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        description: categoryData.description,
        image_url: categoryData.image_url,
        icon: categoryData.icon,
        is_active: categoryData.is_active,
        sort_order: categoryData.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { category }
  })
}

// DELETE - Delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
