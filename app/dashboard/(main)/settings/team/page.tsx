'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Users,
  Mail,
  Shield,
  Trash2,
  Loader2,
  UserCircle,
  Crown,
  ChefHat,
  Coffee,
  UserPlus,
  X,
  Clock,
  Edit,
} from 'lucide-react'

type TeamMember = {
  id: string
  user_id: string
  role: string
  is_active: boolean
  joined_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    location: string | null
    bio: string | null
  }
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

const roleConfig: Record<string, { icon: React.ElementType; color: string }> = {
  owner: { icon: Crown, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  manager: { icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  staff: { icon: Users, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  kitchen: { icon: ChefHat, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  waiter: { icon: Coffee, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
}

export default function TeamPage() {
  const t = useTranslations('teamPage')
  const queryClient = useQueryClient()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff',
    full_name: '',
  })
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    role: 'staff',
    avatar_url: '',
  })
  const supabase = createClient()

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => apiGet<{ data: { members: TeamMember[]; invitations: Invitation[] } }>('/team'),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: typeof formData) => apiPost('/team', data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setIsInviteOpen(false)
      setFormData({ email: '', role: 'staff', full_name: '' })
      
      // Show success message
      if (response?.data?.emailSent) {
        toast.success(t('toasts.inviteSentSuccess'), {
          description: t('toasts.inviteSentSuccessDesc')
        })
      } else {
        toast.warning(t('toasts.inviteCreatedNoEmail'), {
          description: t('toasts.inviteCreatedNoEmailDesc')
        })
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('toasts.inviteFailed'), {
        description: errorMessage
      })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: (data: typeof formData) => apiPost('/team/members', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setIsAddMemberOpen(false)
      setFormData({ email: '', role: 'staff', full_name: '' })
      toast.success(t('toasts.memberAddedSuccess'))
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('toasts.memberAddFailed'), {
        description: errorMessage
      })
    },
  })

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, profileData }: { memberId: string; profileData: any }) => {
      // Update profile via API
      const response = await apiPost('/profile/update', {
        user_id: memberId,
        ...profileData
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setIsEditOpen(false)
      setEditingMember(null)
      toast.success(t('toasts.memberUpdatedSuccess'))
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('toasts.memberUpdateFailed'), {
        description: errorMessage
      })
    },
  })

  const handleImageUpload = async (file: File, userId: string) => {
    if (!file) return null

    setUploading(true)
    try {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image too large. Maximum size is 2MB.')
        return null
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
        return null
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      console.log('Upload successful:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)
      toast.success('Image uploaded successfully!')
      return publicUrl
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(`Failed to upload image: ${error?.message || 'Unknown error'}`)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setEditFormData({
      full_name: member.profiles?.full_name || '',
      role: member.role,
      avatar_url: member.profiles?.avatar_url || '',
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMember) return

    const profileData: any = {
      full_name: editFormData.full_name,
      avatar_url: editFormData.avatar_url,
    }

    updateMemberMutation.mutate({
      memberId: editingMember.user_id,
      profileData
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingMember) return

    const publicUrl = await handleImageUpload(file, editingMember.user_id)
    if (publicUrl) {
      setEditFormData({ ...editFormData, avatar_url: publicUrl })
    }
  }

  const cancelInviteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/team/invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success(t('toasts.invitationCancelled'))
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('toasts.invitationCancelFailed'), {
        description: errorMessage
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => apiDelete(`/team/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      toast.success(t('toasts.memberRemoved'))
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error'
      toast.error(t('toasts.memberRemoveFailed'), {
        description: errorMessage
      })
    },
  })

  const members = data?.data?.members || []
  const invitations = data?.data?.invitations || []

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(formData)
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    addMemberMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('addMember')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addTeamMember')}</DialogTitle>
                <DialogDescription>
                  {t('manuallyAddMember')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">{t('fullNameRequired')}</Label>
                  <Input
                    id="add-name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={t('fullNamePlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">{t('emailAddressRequired')}</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">{t('roleRequired')}</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: string) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                      <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                      <SelectItem value="kitchen">{t('roles.kitchen')}</SelectItem>
                      <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddMemberOpen(false)}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={addMemberMutation.isPending}>
                    {addMemberMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {t('addMemberButton')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                {t('inviteMember')}
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('inviteTeamMember')}</DialogTitle>
              <DialogDescription>
                {t('sendInvitation')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddressRequired')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('roleRequired')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: string) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                    <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                    <SelectItem value="kitchen">{t('roles.kitchen')}</SelectItem>
                    <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {t('sendInvitationButton')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('pendingInvitations')}
            </CardTitle>
            <CardDescription>{t('pendingInvitationCount', { count: invitations.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('invitedAs')} {t(`roles.${invitation.role}`)} • {t('expires')} {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelInviteMutation.mutate(invitation.id)}
                    disabled={cancelInviteMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noMembers')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('noMembersDesc')}
            </p>
            <Button onClick={() => setIsInviteOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('inviteMember')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('teamMembers')}</CardTitle>
            <CardDescription>{t('memberCount', { count: members.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => {
                const config = roleConfig[member.role] || roleConfig.staff
                const RoleIcon = config.icon
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      {member.profiles?.avatar_url ? (
                        <img 
                          src={member.profiles.avatar_url} 
                          alt={member.profiles.full_name || 'User'} 
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <UserCircle className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {member.profiles?.full_name || `User #${member.user_id.slice(0, 8)}`}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{t('joined')} {new Date(member.joined_at).toLocaleDateString()}</span>
                          {member.profiles?.location && (
                            <>
                              <span>•</span>
                              <span>{member.profiles.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {t(`roles.${member.role}`)}
                      </Badge>
                      {member.role !== 'owner' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMutation.mutate(member.id)}
                            disabled={removeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('editMember')}</DialogTitle>
            <DialogDescription>
              {t('editMemberDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {editFormData.avatar_url ? (
                  <img
                    src={editFormData.avatar_url}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border-2"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted border-2">
                    <UserCircle className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    t('uploadPhoto')
                  )}
                </Button>
                {editFormData.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditFormData({ ...editFormData, avatar_url: '' })}
                  >
                    {t('remove')}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('fullNameRequired')}</Label>
              <Input
                id="edit-name"
                value={editFormData.full_name}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                placeholder={t('fullNamePlaceholder')}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">{t('roleRequired')}</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">{t('roles.manager')}</SelectItem>
                  <SelectItem value="staff">{t('roles.staff')}</SelectItem>
                  <SelectItem value="kitchen">{t('roles.kitchen')}</SelectItem>
                  <SelectItem value="waiter">{t('roles.waiter')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMemberMutation.isPending}
            >
              {updateMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('rolePermissions')}</CardTitle>
          <CardDescription>{t('whatEachRoleCan')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(roleConfig).map(([key, config]) => {
              const Icon = config.icon
              return (
                <div key={key} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{t(`roles.${key}`)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(`roleDescriptions.${key}`)}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
