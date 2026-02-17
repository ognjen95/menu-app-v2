import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MapPin, User, UtensilsCrossed, Check, ChevronRight } from 'lucide-react'
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
  t,
}: MobileSetupStepProps) {
  const selectedLocation = locations.find(l => l.id === selectedLocationId)
  const selectedStaff = teamMembers.find(m => m.user_id === selectedStaffId)

  const canContinue = selectedLocationId && selectedStaffId && 
    (orderType !== 'dine_in' || selectedTableId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          <Accordion type="multiple" className="space-y-2">
            {/* Location Accordion */}
            <AccordionItem value="location" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-left">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t('selectLocation')}</span>
                    <span className="font-medium">
                      {selectedLocation?.name || t('selectLocation')}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => onLocationChange(loc.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        selectedLocationId === loc.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium">{loc.name}</span>
                      {selectedLocationId === loc.id && (
                        <Check className="h-4 w-4 text-primary float-right" />
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Staff Accordion */}
            <AccordionItem value="staff" className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 text-left">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t('selectStaff')}</span>
                    <div className="flex items-center gap-2">
                      {selectedStaff && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={selectedStaff.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(selectedStaff.profiles?.full_name || selectedStaff.role).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium">
                        {selectedStaff?.profiles?.full_name || selectedStaff?.role || t('selectStaff')}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {teamMembers.map(member => (
                    <button
                      key={member.user_id}
                      onClick={() => onStaffChange(member.user_id)}
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center gap-2 transition-all",
                        selectedStaffId === member.user_id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(member.profiles?.full_name || member.role).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate flex-1">
                        {member.profiles?.full_name || member.role}
                      </span>
                      {selectedStaffId === member.user_id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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
                    <button
                      key={table.id}
                      onClick={() => onTableChange(table.id)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-center transition-all",
                        selectedTableId === table.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium text-sm">{table.name}</span>
                      {table.zone && (
                        <span className="block text-xs opacity-70">{table.zone}</span>
                      )}
                    </button>
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

      {/* Continue button */}
      <div className="shrink-0 p-4 bg-background border-t">
        <Button
          className="w-full h-12 text-lg"
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
