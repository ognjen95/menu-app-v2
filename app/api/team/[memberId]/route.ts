import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ memberId: string }> }

// GET - Get single team member
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { memberId } = await params

    const { data: member, error } = await supabase
      .from('tenant_users')
      .select(`
        *,
        user:users(id, email, name)
      `)
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { member }
  })
}

// PATCH - Update team member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { memberId } = await params

    const { role, is_active } = body as {
      role?: string
      is_active?: boolean
    }

    // Check if trying to modify owner
    const { data: targetMember } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (targetMember?.role === 'owner') {
      throw new Error('Cannot modify owner role')
    }

    // Only owner can assign manager role
    if (role === 'manager' && user.role !== 'owner') {
      throw new Error('Only owner can assign manager role')
    }

    const updateData: Record<string, unknown> = {}
    if (role) updateData.role = role
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: member, error } = await supabase
      .from('tenant_users')
      .update(updateData)
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { member }
  })
}

// DELETE - Remove team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { memberId } = await params

    // Check if trying to remove owner
    const { data: targetMember } = await supabase
      .from('tenant_users')
      .select('role, user_id')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetMember) {
      throw new Error('Team member not found')
    }

    if (targetMember.role === 'owner') {
      throw new Error('Cannot remove owner from team')
    }

    // Cannot remove yourself
    if (targetMember.user_id === user.id) {
      throw new Error('Cannot remove yourself from team')
    }

    // Only owner can remove managers
    if (targetMember.role === 'manager' && user.role !== 'owner') {
      throw new Error('Only owner can remove managers')
    }

    const { error } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
