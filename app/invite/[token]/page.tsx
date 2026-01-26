'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [emailMismatch, setEmailMismatch] = useState(false)

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
        setError('Invalid or expired invitation')
        return
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        setError('This invitation has expired')
        return
      }

      setInvitation(data)

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
      
      if (user) {
        setCurrentUserEmail(user.email || null)
        // Check if email matches
        if (user.email !== data.email) {
          setEmailMismatch(true)
        }
      }
    } catch (err) {
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setEmailMismatch(false)
    setCurrentUserEmail(null)
  }

  const acceptInvitation = async () => {
    setAccepting(true)
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to complete profile page for new users
        router.push(`/invite/${token}/complete`)
        return
      }

      // Accept the invitation (token is used as the id parameter)
      const response = await fetch(`/api/team/invitations/${token}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show email mismatch UI
  if (emailMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center">Different Account</CardTitle>
            <CardDescription className="text-center">
              This invitation was sent to a different email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Invitation for:</p>
                <p className="font-medium">{invitation?.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">You're logged in as:</p>
                <p className="font-medium">{currentUserEmail}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={handleSignOut}
              >
                Sign Out & Create New Account
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard (Keep Current Account)
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Sign out to create a new account with {invitation?.email} and accept this invitation.
            </p>
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
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">Team Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">You've been invited to join</p>
            <p className="text-2xl font-bold">{invitation?.tenants?.name}</p>
            <p className="text-sm text-muted-foreground">as a</p>
            <p className="text-lg font-semibold capitalize">{invitation?.role}</p>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={acceptInvitation}
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isLoggedIn ? 'Accepting...' : 'Redirecting...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoggedIn ? 'Accept Invitation' : 'Create Account & Accept'}
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/')}
            >
              Decline
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you'll be added to the team and can start collaborating immediately.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
