'use client'

import { useState } from 'react'
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

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  manager: { label: 'Manager', icon: Shield, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  staff: { label: 'Staff', icon: Users, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  kitchen: { label: 'Kitchen', icon: ChefHat, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  waiter: { label: 'Waiter', icon: Coffee, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
}

export default function TeamPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: string) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Send Invitation
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
            <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Invite your team to help manage your business
            </p>
            <Button onClick={() => setIsInviteOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{members.length} member(s)</CardDescription>
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
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={config.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {config.label}
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
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>What each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(roleConfig).map(([key, config]) => {
              const Icon = config.icon
              return (
                <div key={key} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {key === 'owner' && 'Full access to all features and settings'}
                    {key === 'manager' && 'Manage menu, orders, and staff'}
                    {key === 'staff' && 'View and update orders'}
                    {key === 'kitchen' && 'View and manage kitchen orders'}
                    {key === 'waiter' && 'Take orders and serve tables'}
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
