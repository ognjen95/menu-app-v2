'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { motion } from '@/components/ui/animated'
import { Clock, Store, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderWithRelations } from '@/lib/types'
import { statusConfig, typeIcons, formatTimeElapsed, getTimerColor } from './order-card'

interface OrdersListCardsProps {
  orders: OrderWithRelations[]
  onSelectOrder: (order: OrderWithRelations) => void
}

export function OrdersListCards({ orders, onSelectOrder }: OrdersListCardsProps) {
  const t = useTranslations('ordersPage')

  if (orders.length === 0) {
    return null
  }

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {orders.map((order, index) => {
        const TypeIcon = typeIcons[order.type] || Store
        const StatusIcon = statusConfig[order.status]?.icon || Clock
        const config = statusConfig[order.status]
        const timerColor = getTimerColor(order.placed_at)
        const itemsList = order.items?.map(item => ({
          name: item.menu_item?.name || 'Item',
          quantity: item.quantity,
          price: item.unit_price,
          notes: item.notes,
        })) || []
        const totalItems = itemsList.reduce((sum, item) => sum + item.quantity, 0)

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <AccordionItem value={order.id} className="border-0">
              <Card className="overflow-hidden relative">
                {/* Status Bar - Left Edge */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', config?.color)} />
                
                {/* Main Card Content */}
                <div className="pl-4 md:pl-5">
                  <AccordionTrigger className="p-3 md:p-4 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
                    <div 
                      className="flex items-center gap-3 flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectOrder(order)
                      }}
                    >
                      {/* Type Icon */}
                      <div className="flex-shrink-0 flex items-center justify-center rounded-full h-10 w-10 md:h-12 md:w-12 bg-secondary">
                        <TypeIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      </div>

                      {/* Order Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm md:text-base">
                            #{order.order_number || order.id.slice(0, 8)}
                          </span>
                          <Badge className={cn('gap-1 text-xs', config?.badgeColor)}>
                            <StatusIcon className="h-3 w-3" />
                            {t(`status.${order.status}`)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-0.5">
                          <span>{totalItems} {t('items')}</span>
                          <span>•</span>
                          <span className="font-medium text-foreground">€{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      {/* Time */}
                      <span className={cn('text-xs md:text-sm font-medium mr-2', timerColor)}>
                        {formatTimeElapsed(order.placed_at)}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-3 md:px-4 pb-3">
                    <div className="border-t pt-3 bg-muted/30 -mx-3 md:-mx-4 px-3 md:px-4">
                      {/* Items List */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('items')}
                        </p>
                        <div className="space-y-1.5">
                          {itemsList.map((item, idx) => (
                            <div key={idx} className="flex items-start justify-between text-sm">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-muted-foreground">{item.quantity}×</span>
                                  <span className="truncate">{item.name}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground mt-0.5 pl-6">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <span className="text-muted-foreground shrink-0 ml-2">
                                €{((item.price || 0) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {order.customer_notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            {t('notes')}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.customer_notes}</p>
                        </div>
                      )}

                      {/* Table/Location Info */}
                      {(order.table || order.location) && (
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {order.table && (
                            <span>📍 {order.table.name}{order.table.zone ? ` (${order.table.zone})` : ''}</span>
                          )}
                          {order.location && (
                            <span>🏪 {order.location.name}</span>
                          )}
                        </div>
                      )}

                      {/* View Details Button */}
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onSelectOrder(order)}
                        >
                          {t('viewDetails')}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </div>
              </Card>
            </AccordionItem>
          </motion.div>
        )
      })}
    </Accordion>
  )
}
