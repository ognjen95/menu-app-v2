import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List team members for tenant
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    const { data: members, error } = await supabase
      .from('tenant_users')
      .select(`
        id,
        user_id,
        role,
        is_active,
        joined_at,
        location_id
      `)
      .eq('tenant_id', tenantId)
      .order('joined_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    // Get user details from auth (we'll use user_id for now)
    return { members: members || [] }
  })
}

// POST - Invite new team member
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const inviteData = body as {
      email: string
      role: string
      location_id?: string
    }

    if (!inviteData.email || !inviteData.role) {
      throw new Error('Email and role are required')
    }

    // Check if user already exists in auth
    // For now, we'll create an invitation record
    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .insert({
        tenant_id: tenantId,
        email: inviteData.email,
        role: inviteData.role,
        location_id: inviteData.location_id,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) {
      // Table might not exist yet, return a helpful message
      throw new Error('Invitations not yet supported. Please add team members manually.')
    }

    return { invitation }
  })
}
