import React from 'react'
import { useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ControlledField } from '@/components/forms/controlled-field'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ShoppingCart, X, Trash2, User, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CartItemRow } from './cart-item-row'
import type { CartSidebarProps, CustomerInfoValues } from '../types'
import type { Control } from 'react-hook-form'

type CustomerInfoAccordionProps = {
  t: (key: string) => string
  isOpen: boolean
  onToggle: (open: boolean) => void
  control: Control<CustomerInfoValues>
}

const CustomerInfoAccordion = React.memo(function CustomerInfoAccordion({
  t,
  isOpen,
  onToggle,
  control,
}: CustomerInfoAccordionProps) {
  const watchedValues = useWatch({ control })
  const filledCount = [watchedValues?.name, watchedValues?.phone, watchedValues?.notes].filter(Boolean).length

  return (
    <Accordion
      type="single"
      collapsible
      value={isOpen ? 'customer-info' : undefined}
      onValueChange={value => onToggle(value === 'customer-info')}
    >
      <AccordionItem value="customer-info" className="border rounded-lg">
        <AccordionTrigger className="px-3 py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{t('customerInfo')}</span>
            {filledCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filledCount}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 space-y-2">
          <ControlledField<CustomerInfoValues>
            name="name"
            control={control}
            render={({ value, onChange, ref: fieldRef }) => (
              <Input
                ref={fieldRef}
                value={value ?? ''}
                onChange={onChange}
                placeholder={t('customerName')}
                className="h-9"
              />
            )}
          />
          <ControlledField<CustomerInfoValues>
            name="phone"
            control={control}
            render={({ value, onChange, ref: fieldRef }) => (
              <Input
                ref={fieldRef}
                value={value ?? ''}
                onChange={onChange}
                placeholder={t('customerPhone')}
                className="h-9"
              />
            )}
          />
          <ControlledField<CustomerInfoValues>
            name="notes"
            control={control}
            render={({ value, onChange, ref: fieldRef }) => (
              <Input
                ref={fieldRef}
                value={value ?? ''}
                onChange={onChange}
                placeholder={t('notes')}
                className="h-9"
              />
            )}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
})

export function CartSidebar({
  cart,
  cartTotal,
  cartItemsCount,
  isSubmitting,
  customerInfoControl,
  isCustomerInfoOpen,
  onCustomerInfoToggle,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmit,
  onClose,
  className,
  t,
}: CartSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Cart header */}
      <div className="shrink-0 p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">{t('cart')}</span>
          {cartItemsCount > 0 && (
            <Badge variant="secondary">{cartItemsCount}</Badge>
          )}
        </div>
      </div>

      {/* Cart items - scrollable area */}
      <ScrollArea className="flex-1 min-h-0 bg-muted/30 rounded-3xl">
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('cartEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemove={onRemoveItem}
                />
              ))}
              <div className="flex justify-center pt-3 border-t">
                <Button className="w-full" variant="ghost" onClick={onClearCart}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('clear')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - fixed at bottom */}
      {cart.length > 0 && (
        <div className="shrink-0 p-4 pb-8 space-y-3 bg-background">
          {/* Customer info (optional) */}
          <CustomerInfoAccordion
            t={t}
            isOpen={isCustomerInfoOpen}
            onToggle={onCustomerInfoToggle}
            control={customerInfoControl}
          />

          {/* Total */}
          <div className="flex items-center justify-between text-lg font-semibold pt-2">
            <span>{t('total')}</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>

          {/* Submit */}
          <div className='flex items-center justify-between gap-3'>
            <Button onClick={onClose} variant={'secondary'} className="h-12 px-4">
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              className="w-full p-4 text-lg font-semibold"
              onClick={onSubmit}
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? t('creating') : t('placeOrder')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
