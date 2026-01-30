'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { apiGet } from '@/lib/api'
import { useUpdateOrderStatus } from '@/lib/hooks/use-orders'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import {
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  Loader2,
  Settings,
  History,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus, OrderWithRelations } from '@/lib/types'

type ProfileInfo = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type TeamMember = {
  id: string
  user_id: string
  role: string
  profiles: ProfileInfo
}

interface OrderDetailDialogProps {
  order: OrderWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  placed: { label: 'New', color: 'bg-blue-500', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-indigo-500', icon: CheckCircle },
  preparing: { label: 'Preparing', color: 'bg-yellow-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-green-500', icon: Bell },
  served: { label: 'Served', color: 'bg-emerald-500', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-gray-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle },
}

const ALL_STATUSES: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled']

function UserBadge({ profile, action }: { profile: ProfileInfo | null | undefined; action: string }) {
  if (!profile) return null
  
  return (
    <div className="flex items-center gap-2 mt-1">
      <Avatar className="h-5 w-5">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
        </AvatarFallback>
      </Avatar>
      <p className="text-sm text-muted-foreground">
        {action} {profile.full_name || 'Unknown'}
      </p>
    </div>
  )
}

export function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const t = useTranslations('orderDetail')
  const tLogs = useTranslations('orderLogs')
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map())
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  
  const updateStatus = useUpdateOrderStatus()

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setSelectedUserId(user.id)
      }
    }
    fetchCurrentUser()
  }, [])

  // Fetch team members
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => apiGet<{ data: { members: TeamMember[] } }>('/team'),
    enabled: open,
  })
  const teamMembers = teamData?.data?.members || []

  // Reset state when order changes
  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status as OrderStatus)
      // Pre-select current user for assignment
      if (currentUserId) {
        setSelectedUserId(currentUserId)
      }
    }
  }, [order, currentUserId])

  // Fetch profiles for history log
  useEffect(() => {
    if (!open || !order) {
      setProfiles(new Map())
      return
    }

    const fetchProfiles = async () => {
      const userIds = new Set<string>()
      if (order.status_updated_by) userIds.add(order.status_updated_by)
      if (order.accepted_by) userIds.add(order.accepted_by)
      if (order.prepared_by) userIds.add(order.prepared_by)
      if (order.served_by) userIds.add(order.served_by)
      if (order.cancelled_by) userIds.add(order.cancelled_by)

      if (userIds.size === 0) return

      setIsLoadingProfiles(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(userIds))

        if (data) {
          const profileMap = new Map<string, ProfileInfo>()
          data.forEach(p => profileMap.set(p.id, p))
          setProfiles(profileMap)
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error)
      } finally {
        setIsLoadingProfiles(false)
      }
    }

    fetchProfiles()
  }, [open, order])

  const getProfile = (userId: string | null | undefined): ProfileInfo | null => {
    if (!userId) return null
    return profiles.get(userId) || null
  }

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus || selectedStatus === order.status) return
    
    await updateStatus.mutateAsync({ 
      id: order.id, 
      status: selectedStatus,
    })
    onOpenChange(false)
  }

  const StatusIcon = order ? statusConfig[order.status]?.icon || Clock : Clock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>#{order?.order_number}</span>
            {order && (
              <Badge className={cn(
                'ml-2',
                statusConfig[order.status]?.color,
                'text-white'
              )}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {t(`status.${order.status}`)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="actions" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="actions" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('tabs.actions')}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              {t('tabs.history')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="flex-1 overflow-y-auto space-y-6 mt-4">
            {/* Change Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('changeStatus')}</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => {
                    const config = statusConfig[status]
                    const Icon = config.icon
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', config.color)} />
                          {t(`status.${status}`)}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Assign User */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t('assignUser')}</Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.profiles?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.profiles?.full_name || 'Unknown'}</span>
                        {member.user_id === currentUserId && (
                          <Badge variant="secondary" className="text-xs ml-1">{t('you')}</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Button */}
            <Button
              className="w-full"
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending || !selectedStatus || selectedStatus === order?.status}
            >
              {updateStatus.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('updateOrder')
              )}
            </Button>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
            {isLoadingProfiles && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {order && !isLoadingProfiles && (
              <div className="space-y-3">
                {/* Placed */}
                {order.placed_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <Bell className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.placed')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.placed_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{tLogs('orderCreated')}</p>
                    </div>
                  </div>
                )}

                {/* Accepted */}
                {order.accepted_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.accepted')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.accepted_at).toLocaleString()}
                        </p>
                      </div>
                      <UserBadge profile={getProfile(order.accepted_by)} action={tLogs('by')} />
                    </div>
                  </div>
                )}

                {/* Preparing */}
                {order.preparing_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <ChefHat className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.preparing')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.preparing_at).toLocaleString()}
                        </p>
                      </div>
                      <UserBadge profile={getProfile(order.prepared_by)} action={tLogs('by')} />
                    </div>
                  </div>
                )}

                {/* Ready */}
                {order.ready_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <Bell className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.ready')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.ready_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Served */}
                {order.served_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.served')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.served_at).toLocaleString()}
                        </p>
                      </div>
                      <UserBadge profile={getProfile(order.served_by)} action={tLogs('by')} />
                    </div>
                  </div>
                )}

                {/* Completed */}
                {order.completed_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{tLogs('status.completed')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.completed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancelled */}
                {order.cancelled_at && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10">
                    <div className="mt-1">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-destructive">{tLogs('status.cancelled')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.cancelled_at).toLocaleString()}
                        </p>
                      </div>
                      <UserBadge profile={getProfile(order.cancelled_by)} action={tLogs('by')} />
                      {order.cancellation_reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {tLogs('reason')}: {order.cancellation_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* No history yet */}
                {!order.placed_at && !order.accepted_at && !order.preparing_at && 
                 !order.ready_at && !order.served_at && !order.completed_at && !order.cancelled_at && (
                  <p className="text-center text-muted-foreground py-8">{t('noHistory')}</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
