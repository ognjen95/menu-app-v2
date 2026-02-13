import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ orderId: string }> }

// PATCH - Update order status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager', 'staff', 'kitchen', 'waiter'])
    const { orderId } = await params

    const { status, cancellation_reason } = body as {
      status: string
      cancellation_reason?: string
    }

    if (!status) {
      throw new Error('Status is required')
    }

    const validStatuses = ['draft', 'placed', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status')
    }

    // Build update object with appropriate timestamps
    const updateData: Record<string, unknown> = { 
      status,
      status_updated_by: user.id,
      status_updated_at: new Date().toISOString()
    }
    const now = new Date().toISOString()

    switch (status) {
      case 'accepted':
        updateData.accepted_at = now
        updateData.accepted_by = user.id
        break
      case 'preparing':
        updateData.preparing_at = now
        updateData.prepared_by = user.id
        break
      case 'ready':
        updateData.ready_at = now
        break
      case 'served':
        updateData.served_at = now
        updateData.served_by = user.id
        break
      case 'completed':
        updateData.completed_at = now
        break
      case 'cancelled':
        updateData.cancelled_at = now
        updateData.cancelled_by = user.id
        updateData.cancellation_reason = cancellation_reason
        break
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        items:order_items(*)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Update table status if order is completed/cancelled
    if ((status === 'completed' || status === 'cancelled') && order.table_id) {
      await supabase
        .from('tables')
        .update({ status: 'available', current_order_id: null })
        .eq('id', order.table_id)
    }

    return { order }
  })
}
