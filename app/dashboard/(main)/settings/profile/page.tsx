'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Camera, User, Mail, Phone, MapPin, Save, Lock, Eye, EyeOff, LogOut, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ProfileFormData = {
  full_name: string
  phone: string
  location: string
  bio: string
}

type PasswordFormData = {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function ProfilePage() {
  const t = useTranslations('profilePage')
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>()
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, watch, formState: { errors: passwordErrors } } = useForm<PasswordFormData>()

  const newPassword = watch('new_password')

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error
      
      // Fetch user's role from tenant_users
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      // If no profile exists, return a default one
      if (!data) {
        return {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: null,
          phone: '',
          location: '',
          bio: '',
          email: user.email,
          role: tenantUser?.role || 'staff'
        }
      }
      
      return { ...data, email: user.email, role: tenantUser?.role || 'staff' }
    }
  })

  // Set form defaults when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
      })
    }
  }, [profile, reset])

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: data.full_name,
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t('profileUpdated'))
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
    onError: (error: any) => {
      toast.error(t('updateFailed'), { description: error.message })
    }
  })

  // Update password mutation
  const updatePassword = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      })

      if (error) throw error
    },
    onSuccess: () => {
      toast.success(t('passwordUpdated'))
      resetPassword()
    },
    onError: (error: any) => {
      toast.error(t('passwordUpdateFailed'), { description: error.message })
    }
  })

  // Logout handler
  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success(t('logoutSuccess'))
      router.push('/login')
    } catch (error) {
      toast.error(t('logoutFailed'))
      setLoggingOut(false)
    }
  }

  // Upload avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidFileType'))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('fileTooLarge'))
      return
    }

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          avatar_url: publicUrl, 
          updated_at: new Date().toISOString() 
        })

      if (updateError) throw updateError

      toast.success(t('avatarUpdated'))
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    } catch (error: any) {
      toast.error(t('avatarUploadFailed'), { description: error.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('avatar')}</CardTitle>
          <CardDescription>{t('avatarDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 
                   <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-lg">{profile?.full_name || t('noName')}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant={profile?.role === 'owner' ? 'default' : profile?.role === 'manager' ? 'secondary' : 'outline'} className="w-fit">
                <Shield className="h-3 w-3 mr-1" />
                {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || 'Staff'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('personalInfo')}</CardTitle>
          <CardDescription>{t('personalInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => updateProfile.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder={t('fullNamePlaceholder')}
                  className="pl-10"
                  {...register('full_name', { required: t('fullNameRequired') })}
                />
              </div>
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile?.email || ''}
                  readOnly
                  className="pl-10 bg-muted/50 text-foreground cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('emailCannotChange')}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder={t('phonePlaceholder')}
                  className="pl-10"
                  {...register('phone')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">{t('location')}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder={t('locationPlaceholder')}
                  className="pl-10"
                  {...register('location')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t('bio')}</Label>
              <Textarea
                id="bio"
                placeholder={t('bioPlaceholder')}
                rows={3}
                {...register('bio')}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending || !isDirty}>
                {updateProfile.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('saveChanges')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('changePassword')}</CardTitle>
          <CardDescription>{t('changePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword((data) => updatePassword.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">{t('newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={t('newPasswordPlaceholder')}
                  className="pl-10 pr-10"
                  {...registerPassword('new_password', { 
                    required: t('newPasswordRequired'),
                    minLength: { value: 6, message: t('passwordMinLength') }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.new_password && <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">{t('confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className="pl-10 pr-10"
                  {...registerPassword('confirm_password', { 
                    required: t('confirmPasswordRequired'),
                    validate: (value) => value === newPassword || t('passwordsDoNotMatch')
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirm_password && <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {t('updatePassword')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">{t('logoutTitle')}</CardTitle>
          <CardDescription>{t('logoutDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full sm:w-auto"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            {t('logoutButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
