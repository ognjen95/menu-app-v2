import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'
import { OrderStatus } from '@/lib/types'

type RouteParams = { params: Promise<{ orderId: string }> }

const changeStatus = (status: OrderStatus, userId: string) => {
  const now = new Date().toISOString()
  const updateData: Record<string, unknown> = {
    status,
    status_updated_by: userId,
    status_updated_at: now
  }
  switch (status) {
    case 'accepted':
      updateData.accepted_at = now
      updateData.accepted_by = userId
      break
    case 'preparing':
      updateData.preparing_at = now
      updateData.prepared_by = userId
      break
    case 'ready':
      updateData.ready_at = now
      break
    case 'served':
      updateData.served_at = now
      updateData.served_by = userId
      break
    case 'completed':
      updateData.completed_at = now
      break
    case 'cancelled':
      updateData.cancelled_at = now
      updateData.cancelled_by = userId
      break
    default:
      break
  }
  return updateData
}

// PATCH - Update order status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager', 'staff', 'kitchen', 'waiter'])
    const { orderId } = await params

    const { status, user_id, cancellation_reason } = body as {
      status: OrderStatus
      user_id?: string
      cancellation_reason?: string
    }

    if (!status) {
      throw new Error('Status is required')
    }

    const validStatuses: OrderStatus[] = ['draft', 'placed', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled']
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status')
    }

    // Use passed user_id or fallback to logged-in user
    const assignedUserId = user_id || user.id

    // Build update object with appropriate timestamps
    const updateData = changeStatus(status, assignedUserId)

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
