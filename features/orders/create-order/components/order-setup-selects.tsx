import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, UtensilsCrossed, User, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Location, Table } from '@/lib/types'
import type { TeamMember, OrderType } from '../types'

type LocationSelectProps = {
  locations: Location[]
  disabled?: boolean
  selectedLocationId: string
  onLocationChange: (locationId: string) => void
  t: (key: string) => string
}

export function LocationSelect({
  locations,
  disabled,
  selectedLocationId,
  onLocationChange,
  t,
}: LocationSelectProps) {
  return (
    <Select value={selectedLocationId} onValueChange={onLocationChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <MapPin className="h-4 w-4 mr-2 shrink-0" />
        <SelectValue placeholder={t('selectLocation')} />
      </SelectTrigger>
      <SelectContent>
        {locations.map(loc => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type TableSelectProps = {
  tables: Table[]
  selectedTableId: string
  orderType: OrderType
  onTableChange: (tableId: string) => void
  t: (key: string) => string
}

export function TableSelect({
  tables,
  selectedTableId,
  orderType,
  onTableChange,
  t,
}: TableSelectProps) {
  if (orderType !== 'dine_in') {
    return <div className="w-full" />
  }

  return (
    <Select value={selectedTableId} onValueChange={onTableChange} disabled={orderType !== 'dine_in'}>
      <SelectTrigger className={cn(
        "w-full",
        !selectedTableId && "border-destructive focus:border-destructive"
      )}>
        {selectedTableId ?
          <UtensilsCrossed className="h-4 w-4 mr-2 shrink-0" /> :
          <AlertTriangle className="h-4 w-4 text-destructive" />}
        <SelectValue placeholder={t('selectTable')} />
      </SelectTrigger>
      <SelectContent>
        {tables.map(table => (
          <SelectItem key={table.id} value={table.id}>
            {table.name} {table.zone && `(${table.zone})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type StaffSelectProps = {
  teamMembers: TeamMember[]
  selectedUserId: string
  onUserChange: (userId: string) => void
  t: (key: string) => string
}

export function StaffSelect({
  teamMembers,
  selectedUserId,
  onUserChange,
  t,
}: StaffSelectProps) {
  return (
    <Select value={selectedUserId} onValueChange={onUserChange}>
      <SelectTrigger className="w-full">
        <User className="h-4 w-4 mr-2 shrink-0" />
        <SelectValue placeholder={t('selectStaff')} />
      </SelectTrigger>
      <SelectContent>
        {teamMembers.map(member => (
          <SelectItem key={member.user_id} value={member.user_id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{member.profiles?.full_name || member.role}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
