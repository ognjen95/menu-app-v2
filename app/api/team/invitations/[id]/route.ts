import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// DELETE - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    
    const { id } = await params

    const { error } = await supabase
      .from('tenant_invitations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
