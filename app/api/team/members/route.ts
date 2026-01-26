import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'
import { createClient } from '@supabase/supabase-js'

// POST - Manually create team member (for existing users)
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const memberData = body as {
      email: string
      role: string
      full_name?: string
    }

    if (!memberData.email || !memberData.role) {
      throw new Error('Email and role are required')
    }

    // Create a service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // For manual member creation, we need to create an auth user first
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: memberData.email,
      email_confirm: false,
      user_metadata: {
        invited_to_tenant: tenantId,
        invited_role: memberData.role,
        full_name: memberData.full_name || memberData.email,
      }
    })

    if (createError || !newUser.user) {
      throw new Error('Failed to create user account: ' + (createError?.message || 'Unknown error'))
    }

    const userId = newUser.user.id

    // Create or update profile with the full name
    if (memberData.full_name) {
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: memberData.full_name,
        })
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      throw new Error('User is already a team member')
    }

    // Create team member
    const { data: member, error } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: memberData.role,
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { member }
  })
}
