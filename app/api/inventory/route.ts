import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List ingredients
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    const locationId = params.get('location_id')
    const lowStock = params.get('low_stock') === 'true'

    let query = supabase
      .from('ingredients')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (locationId) {
      query = query.or(`location_id.eq.${locationId},location_id.is.null`)
    }

    const { data: ingredients, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    let result = ingredients || []

    // Filter low stock if requested
    if (lowStock) {
      result = result.filter(i => i.is_tracked && i.current_stock <= i.reorder_threshold)
    }

    return { ingredients: result }
  })
}

// POST - Create new ingredient
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const ingredientData = body as {
      name: string
      sku?: string
      unit: string
      current_stock?: number
      reorder_threshold?: number
      cost_per_unit?: number
      supplier?: string
      location_id?: string
      is_tracked?: boolean
    }

    if (!ingredientData.name || !ingredientData.unit) {
      throw new Error('Name and unit are required')
    }

    const { data: ingredient, error } = await supabase
      .from('ingredients')
      .insert({
        tenant_id: tenantId,
        name: ingredientData.name,
        sku: ingredientData.sku,
        unit: ingredientData.unit,
        current_stock: ingredientData.current_stock || 0,
        reorder_threshold: ingredientData.reorder_threshold || 10,
        cost_per_unit: ingredientData.cost_per_unit || 0,
        supplier: ingredientData.supplier,
        location_id: ingredientData.location_id,
        is_tracked: ingredientData.is_tracked ?? true,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { ingredient }
  })
}
