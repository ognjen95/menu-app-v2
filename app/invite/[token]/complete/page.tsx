'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CompleteInvitationPage() {
  const t = useTranslations('invitation')
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

  const loadInvitation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_invitations')
        .select('*, tenants(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        toast.error(t('invalidOrExpired'))
        router.push('/')
        return
      }

      // Check if user is already logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email === data.email) {
          // User is logged in with the same email, redirect to accept
          toast.info(t('youAlreadyHaveAccount'))
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
        toast.error(t('invitationExpired'))
        router.push('/')
        return
      }

      setInvitation(data)
    } catch (err) {
      toast.error(t('failedToLoad'))
      router.push('/')
    } finally {
      setLoading(false)
    }
  }, [router, supabase, token, t])

    useEffect(() => {
    loadInvitation()
  }, [loadInvitation, token])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'))
      return
    }

    if (formData.password.length < 6) {
      toast.error(t('passwordMinLength'))
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
          throw new Error(t('accountExists'))
        }
        throw signUpError
      }

      if (!authData.user) {
        throw new Error(t('failedToCreateUser'))
      }

      // Wait a moment for auth to settle
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('After signup, current user:', currentUser)
      
      if (!currentUser) {
        throw new Error(t('failedToAuth'))
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

      toast.success(t('accountCreated'), {
        description: t('welcomeToTeam')
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error:', err)
      toast.error(t('failedToComplete'), {
        description: err.message
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
            <p className="text-muted-foreground">{t('loading')}</p>
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
          <CardTitle className="text-center">{t('completeProfile')}</CardTitle>
          <CardDescription className="text-center">
            {t('createAccountToJoin')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Info */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{t('youreJoining')}</span>
              </div>
              <p className="text-lg font-semibold">{invitation?.tenants?.name}</p>
              <p className="text-sm text-muted-foreground">
                {t('asRole')} <span className="font-medium capitalize">{invitation?.role}</span>
              </p>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailAddress')}</Label>
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
              <Label htmlFor="full_name">{t('fullNameRequired')}</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t('fullNamePlaceholder')}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordRequired')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('passwordPlaceholder')}
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPasswordRequired')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder={t('confirmPasswordPlaceholder')}
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
                  {t('creatingAccount')}
                </>
              ) : (
                t('createAccountAndJoin')
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {t('termsAgreement', { teamName: invitation?.tenants?.name })}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
