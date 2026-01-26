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
        joined_at
      `)
      .eq('tenant_id', tenantId)
      .order('joined_at', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    // Fetch profiles separately for each member
    const membersWithProfiles = await Promise.all(
      (members || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, phone, location, bio')
          .eq('id', member.user_id)
          .single()
        
        return {
          ...member,
          profiles: profile
        }
      })
    )

    // Also get pending invitations
    const { data: invitations } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return { 
      members: membersWithProfiles || [], 
      invitations: invitations || [] 
    }
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
    }

    if (!inviteData.email || !inviteData.role) {
      throw new Error('Email and role are required')
    }

    // Check if email is already invited or is a member
    const { data: existingInvite } = await supabase
      .from('tenant_invitations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', inviteData.email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      throw new Error('This email already has a pending invitation')
    }

    // Get tenant and inviter details for email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Generate invitation token
    const token = crypto.randomUUID()
    
    // Try to send invitation email first via Mailgun
    let emailSent = false
    let mailgunConfigured = false
    
    try {
      const { sendTeamInvitation } = await import('@/lib/mailgun')
      mailgunConfigured = true
      
      const emailResult = await sendTeamInvitation({
        to: inviteData.email,
        tenantName: tenant?.name || 'the team',
        inviterName: inviter?.full_name || inviter?.email || 'A team member',
        role: inviteData.role,
        token: token,
      })
      
      emailSent = emailResult.success
      
      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error)
        // If Mailgun is configured but email failed, throw error
        throw new Error(`Failed to send invitation email: ${emailResult.error}`)
      }
    } catch (error) {
      // If Mailgun is not configured, allow invitation without email
      if (!mailgunConfigured) {
        console.warn('Mailgun not configured, creating invitation without email')
        emailSent = false
      } else {
        // If Mailgun is configured but failed, don't create invitation
        throw error
      }
    }

    // Only create invitation in DB if email was sent successfully OR Mailgun is not configured
    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .insert({
        tenant_id: tenantId,
        email: inviteData.email,
        role: inviteData.role,
        invited_by: user.id,
        token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { 
      invitation,
      emailSent 
    }
  })
}
