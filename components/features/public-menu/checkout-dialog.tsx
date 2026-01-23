'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  X,
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  UtensilsCrossed,
  ShoppingBag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type CartItem = {
  id: string
  item: {
    id: string
    name: string
    base_price: number
  }
  variant?: { id: string; name: string; price_modifier: number }
  selectedOptions: { id: string; name: string; price: number }[]
  quantity: number
  notes?: string
}

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  cartTotal: number
  tenantId: string
  tenantName: string
  locationId: string
  tableId?: string
  currency?: string
  onOrderComplete: () => void
}

type Step = 'details' | 'payment' | 'confirmation'

export function CheckoutDialog({
  isOpen,
  onClose,
  cart,
  cartTotal,
  tenantId,
  tenantName,
  locationId,
  tableId,
  currency = 'EUR',
  onOrderComplete,
}: CheckoutDialogProps) {
  const [step, setStep] = useState<Step>('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    orderId: string
    orderNumber: string
    status: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerNotes: '',
    orderType: tableId ? 'dine_in' : 'takeaway',
    paymentMethod: 'cash' as 'online' | 'cash' | 'card_pos',
  })

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitOrder = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const orderItems = cart.map(cartItem => ({
        menu_item_id: cartItem.item.id,
        variant_id: cartItem.variant?.id,
        quantity: cartItem.quantity,
        selected_options: cartItem.selectedOptions.map(opt => ({
          option_id: opt.id,
          name: opt.name,
          price: opt.price,
        })),
        notes: cartItem.notes,
      }))

      const response = await fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          location_id: locationId,
          table_id: tableId,
          type: formData.orderType,
          customer_name: formData.customerName || undefined,
          customer_phone: formData.customerPhone || undefined,
          customer_email: formData.customerEmail || undefined,
          customer_notes: formData.customerNotes || undefined,
          payment_method: formData.paymentMethod,
          items: orderItems,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order')
      }

      setOrderResult({
        orderId: result.data.order.id,
        orderNumber: result.data.order.order_number,
        status: result.data.order.status,
      })

      // If online payment, create Stripe checkout session and redirect
      if (formData.paymentMethod === 'online') {
        const checkoutResponse = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: result.data.order.id,
            success_url: `${window.location.origin}/order/success?order_id=${result.data.order.id}`,
            cancel_url: `${window.location.origin}/order/cancel?order_id=${result.data.order.id}`,
          }),
        })
        
        const checkoutResult = await checkoutResponse.json()
        
        if (checkoutResult.data?.checkout_url) {
          window.location.href = checkoutResult.data.checkout_url
          return
        } else {
          throw new Error(checkoutResult.error || 'Failed to create checkout session')
        }
      }

      setStep('confirmation')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (step === 'confirmation') {
      onOrderComplete()
    }
    setStep('details')
    setOrderResult(null)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  const currencySymbol = currency === 'EUR' ? '€' : currency

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {step !== 'details' && step !== 'confirmation' && (
              <Button variant="ghost" size="icon" onClick={() => setStep('details')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="font-bold text-lg">
              {step === 'details' && 'Checkout'}
              {step === 'payment' && 'Payment'}
              {step === 'confirmation' && 'Order Confirmed'}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step: Details */}
            {step === 'details' && (
              <div className="space-y-6">
                {/* Order Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Order Type</Label>
                  <RadioGroup
                    value={formData.orderType}
                    onValueChange={(value: string) => updateForm('orderType', value)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <label
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        formData.orderType === 'dine_in'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      <RadioGroupItem value="dine_in" className="sr-only" />
                      <UtensilsCrossed className="h-6 w-6" />
                      <span className="font-medium">Dine In</span>
                      {tableId && (
                        <span className="text-xs text-muted-foreground">Your table</span>
                      )}
                    </label>
                    <label
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        formData.orderType === 'takeaway'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      <RadioGroupItem value="takeaway" className="sr-only" />
                      <ShoppingBag className="h-6 w-6" />
                      <span className="font-medium">Takeaway</span>
                    </label>
                  </RadioGroup>
                </div>

                {/* Customer Info */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Your Details (Optional)</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Name"
                        value={formData.customerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateForm('customerName', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Phone number"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => updateForm('customerPhone', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Email (for receipt)"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => updateForm('customerEmail', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Special Requests</Label>
                  <Textarea
                    placeholder="Any allergies or special requests..."
                    value={formData.customerNotes}
                    onChange={(e) => updateForm('customerNotes', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Payment Method</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value: string) => updateForm('paymentMethod', value)}
                    className="space-y-2"
                  >
                    <label
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        formData.paymentMethod === 'cash'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      <RadioGroupItem value="cash" className="sr-only" />
                      <Banknote className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Pay at Counter</p>
                        <p className="text-sm text-muted-foreground">Cash or card when ready</p>
                      </div>
                    </label>
                    <label
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                        formData.paymentMethod === 'online'
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/50'
                      )}
                    >
                      <RadioGroupItem value="online" className="sr-only" />
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-sm text-muted-foreground">Secure card payment</p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Order Summary */}
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    {cart.map((item) => {
                      const itemPrice = item.item.base_price + (item.variant?.price_modifier || 0)
                      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
                      const totalPrice = (itemPrice + optionsPrice) * item.quantity

                      return (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.item.name}
                            {item.variant && ` (${item.variant.name})`}
                          </span>
                          <span>{currencySymbol}{totalPrice.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Step: Confirmation */}
            {step === 'confirmation' && orderResult && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Order Placed!</h3>
                <p className="text-muted-foreground mb-6">
                  Your order has been sent to {tenantName}
                </p>
                <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="text-2xl font-bold font-mono">
                    #{orderResult.orderNumber || orderResult.orderId.slice(-6).toUpperCase()}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  {formData.paymentMethod === 'cash' 
                    ? 'Please pay at the counter when your order is ready.'
                    : 'Payment confirmed. Thank you!'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div className="border-t p-4">
              <Button
                className="w-full h-12 text-lg"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    {formData.paymentMethod === 'online' ? 'Proceed to Payment' : 'Place Order'} - {currencySymbol}{cartTotal.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="border-t p-4">
              <Button className="w-full h-12" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
