import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// DELETE - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { id } = await params

    // First delete associated QR codes
    await supabase
      .from('qr_codes')
      .delete()
      .eq('table_id', id)
      .eq('tenant_id', tenantId)

    // Then delete the table
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
