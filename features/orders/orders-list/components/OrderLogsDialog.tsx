'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  CheckCircle,
  XCircle,
  ChefHat,
  Bell,
  Loader2,
} from 'lucide-react'

type ProfileInfo = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type OrderLogsData = {
  order_number: string
  placed_at?: string | null
  accepted_at?: string | null
  preparing_at?: string | null
  ready_at?: string | null
  served_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancellation_reason?: string | null
  // User IDs
  status_updated_by?: string | null
  accepted_by?: string | null
  prepared_by?: string | null
  served_by?: string | null
  cancelled_by?: string | null
}

interface OrderLogsDialogProps {
  order: OrderLogsData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function OrderLogsDialog({ order, open, onOpenChange }: OrderLogsDialogProps) {
  const t = useTranslations('orderLogs')
  const [profiles, setProfiles] = useState<Map<string, ProfileInfo>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  // Fetch profiles when dialog opens
  useEffect(() => {
    if (!open || !order) {
      setProfiles(new Map())
      return
    }

    const fetchProfiles = async () => {
      // Collect all unique user IDs
      const userIds = new Set<string>()
      if (order.status_updated_by) userIds.add(order.status_updated_by)
      if (order.accepted_by) userIds.add(order.accepted_by)
      if (order.prepared_by) userIds.add(order.prepared_by)
      if (order.served_by) userIds.add(order.served_by)
      if (order.cancelled_by) userIds.add(order.cancelled_by)

      if (userIds.size === 0) return

      setIsLoading(true)
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
        setIsLoading(false)
      }
    }

    fetchProfiles()
  }, [open, order])

  // Helper to get profile by user ID
  const getProfile = (userId: string | null | undefined): ProfileInfo | null => {
    if (!userId) return null
    return profiles.get(userId) || null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { orderNumber: `#${order?.order_number ?? ""}` })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {order && !isLoading && (
            <div className="space-y-3">
              {/* Placed */}
              {order.placed_at && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="mt-1">
                    <Bell className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{t('status.placed')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.placed_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('orderCreated')}</p>
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
                      <p className="font-medium">{t('status.accepted')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.accepted_at).toLocaleString()}
                      </p>
                    </div>
                    <UserBadge profile={getProfile(order.accepted_by)} action={t('by')} />
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
                      <p className="font-medium">{t('status.preparing')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.preparing_at).toLocaleString()}
                      </p>
                    </div>
                    <UserBadge profile={getProfile(order.prepared_by)} action={t('by')} />
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
                      <p className="font-medium">{t('status.ready')}</p>
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
                      <p className="font-medium">{t('status.served')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.served_at).toLocaleString()}
                      </p>
                    </div>
                    <UserBadge profile={getProfile(order.served_by)} action={t('by')} />
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
                      <p className="font-medium">{t('status.completed')}</p>
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
                      <p className="font-medium text-destructive">{t('status.cancelled')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.cancelled_at).toLocaleString()}
                      </p>
                    </div>
                    <UserBadge profile={getProfile(order.cancelled_by)} action={t('by')} />
                    {order.cancellation_reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('reason')}: {order.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Last Status Update Info */}
              {order.status_updated_by && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">{t('lastStatusUpdate')}:</p>
                  <UserBadge profile={getProfile(order.status_updated_by)} action={t('updatedBy')} />
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
