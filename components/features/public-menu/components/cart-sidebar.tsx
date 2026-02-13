'use client'

import { memo } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'

type CartItem = {
  id: string
  item: any // eslint-disable-line
  variant?: { id: string; name: string; price_modifier: number }
  selectedVariants?: Record<string, string[]>
  selectedVariantInfos?: { id: string; name: string; price_adjustment: number }[]
  calculatedPrice?: number
  selectedOptions: { id: string; name: string; price: number }[]
  quantity: number
  notes?: string
}

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

interface CartSidebarProps {
  isOpen: boolean
  cart: CartItem[]
  cartTotal: number
  theme: Theme
  cardBg: string
  borderColor: string
  mutedForeground: string
  tYourOrder: string
  tCartEmpty: string
  tTotal: string
  tPlaceOrder: string
  getTranslatedText: (id: string, field: 'name' | 'description', fallback: string, type?: any) => string // eslint-disable-line
  getContrastColor: (hex: string) => string
  onClose: () => void
  onUpdateQuantity: (cartItemId: string, delta: number) => void
  onRemoveItem: (cartItemId: string) => void
  onCheckout: () => void
}

export const CartSidebar = memo(function CartSidebar({
  isOpen,
  cart,
  cartTotal,
  theme,
  cardBg,
  borderColor,
  mutedForeground,
  tYourOrder,
  tCartEmpty,
  tTotal,
  tPlaceOrder,
  getTranslatedText,
  getContrastColor,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm" style={{ backgroundColor: `${theme.background}cc` }}>
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md shadow-xl"
        style={{ backgroundColor: theme.background, borderLeft: `1px solid ${borderColor}` }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <h2 className="font-bold text-lg" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{tYourOrder}</h2>
            <button
              className="p-2 rounded-md"
              style={{ color: theme.foreground }}
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" style={{ color: mutedForeground }} />
                <p style={{ color: mutedForeground }}>{tCartEmpty}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((cartItem) => {
                  // Use calculatedPrice if available (new variant system)
                  const itemPrice = cartItem.calculatedPrice ?? (cartItem.item.base_price + (cartItem.variant?.price_modifier || 0))
                  const optionsPrice = cartItem.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
                  const totalPrice = (itemPrice + optionsPrice) * cartItem.quantity

                  return (
                    <div key={cartItem.id} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: cardBg }}>
                      <div className="flex-1">
                        <h4 className="font-medium" style={{ color: theme.foreground }}>
                          {getTranslatedText(cartItem.item.id, 'name', cartItem.item.name)}
                        </h4>
                        {cartItem.variant && (
                          <p className="text-sm" style={{ color: mutedForeground }}>{cartItem.variant.name}</p>
                        )}
                        {cartItem.selectedVariantInfos && cartItem.selectedVariantInfos.length > 0 && (
                          <p className="text-sm" style={{ color: mutedForeground }}>
                            {cartItem.selectedVariantInfos.map(v => getTranslatedText(v.id, 'name', v.name, 'menu_item_variant')).join(', ')}
                          </p>
                        )}
                        {cartItem.selectedOptions.length > 0 && (
                          <p className="text-sm" style={{ color: mutedForeground }}>
                            + {cartItem.selectedOptions.map(o => o.name).join(', ')}
                          </p>
                        )}
                        <p className="font-semibold mt-1" style={{ color: theme.foreground }}>€{totalPrice.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 rounded-md flex items-center justify-center"
                          style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                          onClick={() => onUpdateQuantity(cartItem.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium" style={{ color: theme.foreground }}>{cartItem.quantity}</span>
                        <button
                          className="h-8 w-8 rounded-md flex items-center justify-center"
                          style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                          onClick={() => onUpdateQuantity(cartItem.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          className="h-8 w-8 rounded-md flex items-center justify-center ml-1"
                          style={{ color: '#EF4444' }}
                          onClick={() => onRemoveItem(cartItem.id)}
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-4 space-y-4" style={{ borderTop: `1px solid ${borderColor}` }}>
              <div className="flex justify-between text-lg font-bold" style={{ color: theme.foreground }}>
                <span>{tTotal}</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="w-full h-12 text-lg rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 6px 20px 0 ${theme.primary}50` }}
                onClick={onCheckout}
              >
                {tPlaceOrder}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
