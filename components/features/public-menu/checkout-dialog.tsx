'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  MapPin,
  AlertCircle,
  Truck,
} from 'lucide-react'

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
  onlinePaymentsEnabled?: boolean
  dineInEnabled?: boolean
  takeawayEnabled?: boolean
  deliveryEnabled?: boolean
  theme?: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
  }
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
  onlinePaymentsEnabled = false,
  dineInEnabled = true,
  takeawayEnabled = true,
  deliveryEnabled = false,
  theme,
}: CheckoutDialogProps) {
  const t = useTranslations('checkoutDialog')
  // Default theme fallback
  const colors = {
    primary: theme?.primary || '#3B82F6',
    secondary: theme?.secondary || '#F4F4F5',
    background: theme?.background || '#FFFFFF',
    foreground: theme?.foreground || '#18181B',
    accent: theme?.accent || '#F97316',
  }
  const [step, setStep] = useState<Step>('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    orderId: string
    orderNumber: string
    status: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Determine default order type based on what's enabled
  const getDefaultOrderType = () => {
    if (tableId && dineInEnabled) return 'dine_in'
    if (takeawayEnabled) return 'takeaway'
    if (deliveryEnabled) return 'delivery'
    if (dineInEnabled) return 'dine_in'
    return 'dine_in' // fallback
  }

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerNotes: '',
    deliveryAddress: '',
    orderType: getDefaultOrderType(),
    paymentMethod: 'cash' as 'online' | 'cash' | 'card_pos',
  })

  // Count enabled order types
  const enabledOrderTypes = [dineInEnabled, takeawayEnabled, deliveryEnabled].filter(Boolean).length
  const showOrderTypeSelector = enabledOrderTypes > 1

  // Validation for delivery (requires name, phone, and address)
  const isDelivery = formData.orderType === 'delivery'
  const deliveryValid = !isDelivery || (formData.customerName.trim() && formData.customerPhone.trim() && formData.deliveryAddress.trim())

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
          delivery_address: formData.orderType === 'delivery' && formData.deliveryAddress ? formData.deliveryAddress : undefined,
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
    <div 
      className="fixed inset-0 z-50 backdrop-blur-sm"
      style={{ backgroundColor: `${colors.foreground}40` }}
    >
      <div 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l shadow-xl"
        style={{ backgroundColor: colors.background, color: colors.foreground }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4"
            style={{ borderBottom: `1px solid ${colors.foreground}15` }}
          >
            {step !== 'details' && step !== 'confirmation' && (
              <button 
                onClick={() => setStep('details')}
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: colors.foreground }}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="font-bold text-lg" style={{ color: colors.primary }}>
              {step === 'details' && t('checkout')}
              {step === 'payment' && t('payment')}
              {step === 'confirmation' && t('orderConfirmed')}
            </h2>
            <button 
              onClick={handleClose}
              className="p-2 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: colors.foreground }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Step: Details */}
            {step === 'details' && (
              <div className="space-y-6">
                {/* Order Type - only show selector if multiple options enabled */}
                {showOrderTypeSelector ? (
                  <div className="space-y-3">
                    <label className="text-base font-semibold" style={{ color: colors.foreground }}>{t('orderType')}</label>
                    <div className={`grid gap-3 ${enabledOrderTypes === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {dineInEnabled && (
                        <button
                          type="button"
                          onClick={() => updateForm('orderType', 'dine_in')}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                          style={{
                            borderColor: formData.orderType === 'dine_in' ? colors.primary : `${colors.foreground}20`,
                            backgroundColor: formData.orderType === 'dine_in' ? `${colors.primary}10` : 'transparent',
                            color: colors.foreground,
                          }}
                        >
                          <UtensilsCrossed className="h-6 w-6" />
                          <span className="font-medium text-sm">{t('dineIn')}</span>
                        </button>
                      )}
                      {takeawayEnabled && (
                        <button
                          type="button"
                          onClick={() => updateForm('orderType', 'takeaway')}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                          style={{
                            borderColor: formData.orderType === 'takeaway' ? colors.primary : `${colors.foreground}20`,
                            backgroundColor: formData.orderType === 'takeaway' ? `${colors.primary}10` : 'transparent',
                            color: colors.foreground,
                          }}
                        >
                          <ShoppingBag className="h-6 w-6" />
                          <span className="font-medium text-sm">{t('takeaway')}</span>
                        </button>
                      )}
                      {deliveryEnabled && (
                        <button
                          type="button"
                          onClick={() => updateForm('orderType', 'delivery')}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors"
                          style={{
                            borderColor: formData.orderType === 'delivery' ? colors.primary : `${colors.foreground}20`,
                            backgroundColor: formData.orderType === 'delivery' ? `${colors.primary}10` : 'transparent',
                            color: colors.foreground,
                          }}
                        >
                          <Truck className="h-6 w-6" />
                          <span className="font-medium text-sm">{t('delivery')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: `${colors.foreground}08` }}>
                    {formData.orderType === 'dine_in' && (
                      <><UtensilsCrossed className="h-5 w-5" style={{ color: colors.primary }} /><span className="font-medium" style={{ color: colors.foreground }}>{t('dineInOrder')}</span></>
                    )}
                    {formData.orderType === 'takeaway' && (
                      <><ShoppingBag className="h-5 w-5" style={{ color: colors.primary }} /><span className="font-medium" style={{ color: colors.foreground }}>{t('takeawayOrder')}</span></>
                    )}
                    {formData.orderType === 'delivery' && (
                      <><Truck className="h-5 w-5" style={{ color: colors.primary }} /><span className="font-medium" style={{ color: colors.foreground }}>{t('deliveryOrder')}</span></>
                    )}
                  </div>
                )}

                {/* Customer Info */}
                <div className="space-y-4">
                  <label className="text-base font-semibold" style={{ color: colors.foreground }}>
                    {isDelivery ? t('yourDetailsRequired') : t('yourDetailsOptional')}
                  </label>
                  {isDelivery && (
                    <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ backgroundColor: `${colors.accent}15`, color: colors.foreground }}>
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.accent }} />
                      <span>{t('deliveryRequiredMessage')}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${colors.foreground}60` }} />
                      <input
                        placeholder={isDelivery ? t('nameRequired') : t('name')}
                        value={formData.customerName}
                        onChange={(e) => updateForm('customerName', e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg border outline-none transition-colors"
                        style={{ 
                          backgroundColor: colors.background, 
                          color: colors.foreground,
                          borderColor: isDelivery && !formData.customerName.trim() ? colors.accent : `${colors.foreground}20`,
                        }}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${colors.foreground}60` }} />
                      <input
                        placeholder={isDelivery ? t('phoneRequired') : t('phone')}
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => updateForm('customerPhone', e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg border outline-none transition-colors"
                        style={{ 
                          backgroundColor: colors.background, 
                          color: colors.foreground,
                          borderColor: isDelivery && !formData.customerPhone.trim() ? colors.accent : `${colors.foreground}20`,
                        }}
                      />
                    </div>
                    {isDelivery && (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4" style={{ color: `${colors.foreground}60` }} />
                        <textarea
                          placeholder={t('deliveryAddress')}
                          value={formData.deliveryAddress}
                          onChange={(e) => updateForm('deliveryAddress', e.target.value)}
                          rows={2}
                          className="w-full py-2 pl-10 pr-3 rounded-lg border outline-none resize-none transition-colors"
                          style={{ 
                            backgroundColor: colors.background, 
                            color: colors.foreground,
                            borderColor: isDelivery && !formData.deliveryAddress.trim() ? colors.accent : `${colors.foreground}20`,
                          }}
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: `${colors.foreground}60` }} />
                      <input
                        placeholder={t('email')}
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => updateForm('customerEmail', e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg border outline-none transition-colors"
                        style={{ 
                          backgroundColor: colors.background, 
                          color: colors.foreground,
                          borderColor: `${colors.foreground}20`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="text-base font-semibold" style={{ color: colors.foreground }}>{t('specialRequests')}</label>
                  <textarea
                    placeholder={t('specialRequestsPlaceholder')}
                    value={formData.customerNotes}
                    onChange={(e) => updateForm('customerNotes', e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-lg border outline-none resize-none transition-colors"
                    style={{ 
                      backgroundColor: colors.background, 
                      color: colors.foreground,
                      borderColor: `${colors.foreground}20`,
                    }}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="text-base font-semibold" style={{ color: colors.foreground }}>{t('paymentMethod')}</label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => updateForm('paymentMethod', 'cash')}
                      className="w-full flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors text-left"
                      style={{
                        borderColor: formData.paymentMethod === 'cash' ? colors.primary : `${colors.foreground}20`,
                        backgroundColor: formData.paymentMethod === 'cash' ? `${colors.primary}10` : 'transparent',
                        color: colors.foreground,
                      }}
                    >
                      <Banknote className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{t('payAtCounter')}</p>
                        <p className="text-sm" style={{ opacity: 0.6 }}>{t('payAtCounterDesc')}</p>
                      </div>
                    </button>
                    {onlinePaymentsEnabled && (
                      <button
                        type="button"
                        onClick={() => updateForm('paymentMethod', 'online')}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors text-left"
                        style={{
                          borderColor: formData.paymentMethod === 'online' ? colors.primary : `${colors.foreground}20`,
                          backgroundColor: formData.paymentMethod === 'online' ? `${colors.primary}10` : 'transparent',
                          color: colors.foreground,
                        }}
                      >
                        <CreditCard className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{t('payOnline')}</p>
                          <p className="text-sm" style={{ opacity: 0.6 }}>{t('payOnlineDesc')}</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div 
                  className="space-y-3 p-4 rounded-lg"
                  style={{ backgroundColor: `${colors.foreground}08` }}
                >
                  <h3 className="font-semibold" style={{ color: colors.foreground }}>{t('orderSummary')}</h3>
                  <div className="space-y-2 text-sm">
                    {cart.map((item) => {
                      const itemPrice = item.item.base_price + (item.variant?.price_modifier || 0)
                      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
                      const totalPrice = (itemPrice + optionsPrice) * item.quantity

                      return (
                        <div key={item.id} className="flex justify-between" style={{ color: colors.foreground }}>
                          <span>
                            {item.quantity}x {item.item.name}
                            {item.variant && ` (${item.variant.name})`}
                          </span>
                          <span>{currencySymbol}{totalPrice.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div 
                    className="pt-2 flex justify-between font-bold"
                    style={{ borderTop: `1px solid ${colors.foreground}15`, color: colors.foreground }}
                  >
                    <span>{t('total')}</span>
                    <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div 
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                  >
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Step: Confirmation */}
            {step === 'confirmation' && orderResult && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div 
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <CheckCircle2 className="h-10 w-10" style={{ color: colors.primary }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>{t('orderPlaced')}</h3>
                <p className="mb-6" style={{ color: colors.foreground, opacity: 0.7 }}>
                  {t('orderSentTo', { tenantName })}
                </p>
                <div 
                  className="rounded-lg p-4 w-full max-w-xs"
                  style={{ backgroundColor: `${colors.foreground}10` }}
                >
                  <p className="text-sm" style={{ color: colors.foreground, opacity: 0.6 }}>{t('orderNumber')}</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: colors.primary }}>
                    #{orderResult.orderNumber || orderResult.orderId.slice(-6).toUpperCase()}
                  </p>
                </div>
                <p className="text-sm mt-6" style={{ color: colors.foreground, opacity: 0.6 }}>
                  {formData.paymentMethod === 'cash' 
                    ? t('payAtCounterMessage')
                    : t('paymentConfirmed')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div className="p-4" style={{ borderTop: `1px solid ${colors.foreground}15` }}>
              <button
                className="w-full h-12 text-lg font-semibold rounded-lg disabled:opacity-50 transition-opacity flex items-center justify-center"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cart.length === 0 || !deliveryValid}
                style={{ backgroundColor: colors.primary, color: '#fff' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t('placingOrder')}
                  </>
                ) : (
                  <>
                    {formData.paymentMethod === 'online' ? t('proceedToPayment') : t('placeOrder')} - {currencySymbol}{cartTotal.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'confirmation' && (
            <div className="p-4" style={{ borderTop: `1px solid ${colors.foreground}15` }}>
              <button 
                className="w-full h-12 font-semibold rounded-lg transition-opacity"
                onClick={handleClose}
                style={{ backgroundColor: colors.primary, color: '#fff' }}
              >
                {t('done')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
