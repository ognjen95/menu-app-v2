import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// POST - Update any user's profile (for managers/owners)
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const { user_id, full_name, avatar_url, phone, location, bio } = body as {
      user_id: string
      full_name?: string
      avatar_url?: string
      phone?: string
      location?: string
      bio?: string
    }

    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Verify the target user is in the same tenant
    const { data: targetMember } = await supabase
      .from('tenant_users')
      .select('id, role')
      .eq('user_id', user_id)
      .eq('tenant_id', tenantId)
      .single()

    if (!targetMember) {
      throw new Error('User not found in your tenant')
    }

    // Cannot edit owner profile unless you are the owner
    if (targetMember.role === 'owner' && user.role !== 'owner') {
      throw new Error('Cannot edit owner profile')
    }

    // Update profile
    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (bio !== undefined) updateData.bio = bio

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user_id,
        ...updateData,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { profile }
  })
}
