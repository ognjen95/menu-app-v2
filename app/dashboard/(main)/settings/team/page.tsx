'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiDelete } from '@/lib/api'
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
} from 'lucide-react'

type TeamMember = {
  id: string
  user_id: string
  role: string
  is_active: boolean
  joined_at: string
  location_id?: string
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
  const [formData, setFormData] = useState({
    email: '',
    role: 'staff',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => apiGet<{ data: { members: TeamMember[] } }>('/team'),
  })

  const inviteMutation = useMutation({
    mutationFn: (data: typeof formData) => apiPost('/team', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setIsInviteOpen(false)
      setFormData({ email: '', role: 'staff' })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })

  const members = data?.data?.members || []

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    inviteMutation.mutate(formData)
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
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">User #{member.user_id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('joined')} {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {t(`roles.${member.role}`)}
                      </Badge>
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMutation.mutate(member.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
