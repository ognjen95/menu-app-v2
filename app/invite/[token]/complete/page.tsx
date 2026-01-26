'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CompleteInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_invitations')
        .select('*, tenants(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        toast.error('Invalid or expired invitation')
        router.push('/')
        return
      }

      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email === data.email) {
          // User is logged in with the same email, redirect to accept
          toast.info('You already have an account with this email')
          router.push(`/invite/${token}`)
          return
        } else {
          // User is logged in with a different email, sign them out
          await supabase.auth.signOut()
        }
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        toast.error('This invitation has expired')
        router.push('/')
        return
      }

      setInvitation(data)
    } catch (err) {
      toast.error('Failed to load invitation')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)

    try {
      // Sign up the user with the invitation email
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email, // Use invitation email
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
        },
      })

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        }
        throw signUpError
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      // Wait a moment for auth to settle
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('After signup, current user:', currentUser)
      
      if (!currentUser) {
        throw new Error('Failed to authenticate after signup. Please try logging in.')
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: formData.full_name,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }

      // Accept the invitation
      console.log('Accepting invitation with user:', currentUser.email)
      const response = await fetch(`/api/team/invitations/${token}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Account created successfully!', {
        description: 'Welcome to the team!'
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error:', err)
      toast.error('Failed to complete setup', {
        description: err.message || 'Please try again'
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <UserPlus className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Create your account to join the team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>You're joining</span>
              </div>
              <p className="text-lg font-semibold">{invitation?.tenants?.name}</p>
              <p className="text-sm text-muted-foreground">
                as a <span className="font-medium capitalize">{invitation?.role}</span>
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Join Team'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to join {invitation?.tenants?.name} and 
              collaborate with the team.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
