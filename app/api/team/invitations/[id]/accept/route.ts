import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = (await params).id // Using 'id' param as token

  try {
    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

      console.log({
        inviteError,
        invitation
      })

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if user email matches invitation email
    console.log('Email check:', {
      userEmail: user.email,
      invitationEmail: invitation.email,
      match: user.email === invitation.email
    })
    
    if (user.email !== invitation.email) {
      return NextResponse.json({ 
        error: `This invitation was sent to ${invitation.email}, but you are logged in as ${user.email}` 
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', invitation.tenant_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Update invitation status
      await supabase
        .from('tenant_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      return NextResponse.json({ 
        message: 'You are already a member of this team',
        alreadyMember: true 
      })
    }

    // Use admin client to add user to tenant (bypasses RLS)
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

    console.log('Inserting into tenant_users:', {
      tenant_id: invitation.tenant_id,
      user_id: user.id,
      role: invitation.role,
    })
    
    const { data: newMember, error: memberError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    console.log('Insert result:', { newMember, memberError })

    if (memberError) {
      throw new Error(`Failed to add to team: ${memberError.message}`)
    }

    // Update invitation status with admin client
    const { error: updateError } = await supabaseAdmin
      .from('tenant_invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Failed to update invitation status:', updateError)
      // Don't throw here - user is already added to team
    }

    return NextResponse.json({ 
      message: 'Invitation accepted successfully',
      tenantId: invitation.tenant_id 
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
