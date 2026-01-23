import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ ingredientId: string }> }

// POST - Adjust ingredient stock
export async function POST(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager', 'staff'])
    const { ingredientId } = await params

    const { quantity, reason, notes } = body as {
      quantity: number
      reason: 'purchase' | 'waste' | 'adjustment' | 'transfer'
      notes?: string
    }

    if (quantity === undefined || !reason) {
      throw new Error('Quantity and reason are required')
    }

    // Get current stock
    const { data: ingredient, error: fetchError } = await supabase
      .from('ingredients')
      .select('current_stock, tenant_id')
      .eq('id', ingredientId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !ingredient) {
      throw new Error('Ingredient not found')
    }

    const quantityBefore = ingredient.current_stock
    const quantityAfter = quantityBefore + quantity

    if (quantityAfter < 0) {
      throw new Error('Stock cannot be negative')
    }

    // Update stock
    const { data: updated, error: updateError } = await supabase
      .from('ingredients')
      .update({ current_stock: quantityAfter })
      .eq('id', ingredientId)
      .select()
      .single()

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Log the adjustment
    await supabase.from('stock_adjustments').insert({
      ingredient_id: ingredientId,
      tenant_id: tenantId,
      user_id: user.id,
      quantity_before: quantityBefore,
      quantity_change: quantity,
      quantity_after: quantityAfter,
      reason,
      notes,
    })

    return { ingredient: updated }
  })
}
