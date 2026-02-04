import { NextRequest, NextResponse } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ categoryId: string }> }

// GET - Get single variant category
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { categoryId } = await params

    const { data: category, error } = await supabase
      .from('variant_categories')
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

// PATCH - Update variant category
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    const updateData = body as {
      name?: string
      description?: string
      is_required?: boolean
      allow_multiple?: boolean
      is_active?: boolean
      sort_order?: number
    }

    const { data: category, error } = await supabase
      .from('variant_categories')
      .update(updateData)
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

// DELETE - Delete variant category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { categoryId } = await params

    // Check if category has variants
    const { count } = await supabase
      .from('menu_item_variants')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)

    if (count && count > 0) {
      throw new Error(`Cannot delete category with ${count} variant(s). Delete variants first.`)
    }

    const { error } = await supabase
      .from('variant_categories')
      .delete()
      .eq('id', categoryId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
