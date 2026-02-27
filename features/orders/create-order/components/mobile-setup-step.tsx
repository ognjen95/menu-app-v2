'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MapPin, User, UtensilsCrossed, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

import { OrderTypeSelectorMobile } from './order-type-selector'
import type { MobileSetupStepProps } from '../types'

export function MobileSetupStep({
  locations,
  selectedLocationId,
  onLocationChange,
  teamMembers,
  selectedStaffId,
  onStaffChange,
  orderType,
  onOrderTypeChange,
  tables,
  selectedTableId,
  onTableChange,
  onContinue,
  onBack,
  t,
}: MobileSetupStepProps) {
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false)
  
  const selectedLocation = locations.find(l => l.id === selectedLocationId)
  const selectedStaff = teamMembers.find(m => m.user_id === selectedStaffId)

  const canContinue = selectedLocationId && selectedStaffId && 
    (orderType !== 'dine_in' || selectedTableId)

  const handleStaffSelect = (userId: string) => {
    onStaffChange(userId)
    setStaffDrawerOpen(false)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-2 space-y-3">
          {/* Location & Staff */}
          <div className="grid grid-cols-2 gap-2">
            {/* Location - disabled button */}
            <Button
              variant="secondary"
              size="lg"
              className="h-10 rounded-xl gap-2 justify-start"
              disabled
            >
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">
                {selectedLocation?.name || '-'}
              </span>
            </Button>

            {/* Staff - clickable, opens drawer */}
            <Button
              variant="secondary"
              size="lg"
              className="h-10 rounded-xl gap-2 justify-start"
              onClick={() => setStaffDrawerOpen(true)}
            >
              {selectedStaff ? (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedStaff.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {(selectedStaff.profiles?.full_name || selectedStaff.role).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="truncate text-sm">
                {selectedStaff?.profiles?.full_name || selectedStaff?.role || '-'}
              </span>
            </Button>
          </div>

          {/* Staff Selection Drawer */}
          <Sheet open={staffDrawerOpen} onOpenChange={setStaffDrawerOpen} nested>
            <SheetContent side="bottom" className="p-0 flex flex-col">
              <SheetHeader className="px-4 pt-2 pb-3 shrink-0">
                <SheetTitle className="text-base text-center">
                  {t('selectStaff')}
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">
                <div className="flex flex-col gap-2">
                  {teamMembers.map(member => (
                    <Button
                      key={member.user_id}
                      size="lg"
                      variant={selectedStaffId === member.user_id ? "default" : "secondary"}
                      onClick={() => handleStaffSelect(member.user_id)}
                      className="h-12 rounded-xl gap-3 justify-start px-4"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">
                          {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {member.profiles?.full_name || member.role}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Order Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              {t('orderType')}
            </label>
            <OrderTypeSelectorMobile
              orderType={orderType}
              onOrderTypeChange={onOrderTypeChange}
              t={t}
            />
          </div>

          {/* Table Selection (only for dine_in) */}
          {orderType === 'dine_in' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                {t('selectTableTitle')}
              </label>
              {tables.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {tables.map(table => (
                    <Button
                      key={table.id}
                      size="lg"
                      variant={
                        selectedTableId === table.id ? "default" : "secondary"
                      }
                      onClick={() => onTableChange(table.id)}
                      className={cn(
                        "p-3 h-auto rounded-lg text-center transition-all flex flex-col",
                        selectedTableId === table.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium text-sm">{table.name}</span>
                      {table.zone && (
                        <span className="block text-xs opacity-70">{table.zone}</span>
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noTablesAvailable')}
                </p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer buttons */}
      <div className="shrink-0 p-4 pb-8 bg-background border-t flex gap-3">
        <Button
          variant="secondary"
          className="h-12 px-4"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          className="flex-1 h-12 text-lg"
          onClick={onContinue}
          disabled={!canContinue}
        >
          {t('continue')}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
