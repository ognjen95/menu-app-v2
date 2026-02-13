'use client'

import { memo } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'

type CartItem = {
  id: string
  item: any
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
  getTranslatedText: (id: string, field: 'name' | 'description', fallback: string, type?: any) => string
  getContrastColor: (hex: string) => string
  onClose: () => void
  onUpdateQuantity: (cartItemId: string, delta: number) => void
  onRemoveItem: (cartItemId: string) => void
  onCheckout: () => void
}

export const CartSidebar = memo(function CartSidebar(props: CartSidebarProps) {
  const {
    isOpen,
    cart,
    cartTotal,
    theme,
    borderColor,
    tYourOrder,
    tTotal,
    tPlaceOrder,
    getContrastColor,
    onClose,
    onCheckout,
  } = props || {};

  return (
    <>
      {isOpen && (
        <>
          <div
            className="hidden md:block fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
          />
          <div
            className="hidden md:flex fixed right-0 top-0 bottom-0 w-full max-w-md shadow-2xl z-[70] animate-slide-in-right rounded-3xl"
            style={{ backgroundColor: theme.background, borderLeft: `1px solid ${borderColor}` }}
          >
            <div className="flex flex-col h-full w-full">
              <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <h2 className="font-bold text-lg" style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{tYourOrder}</h2>
                <button
                  className="p-2 rounded-md hover:bg-opacity-10 transition-colors"
                  style={{ color: theme.foreground }}
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <CartItems {...props} />
              </div>

              {cart.length > 0 && (
                <div className="p-4 space-y-4 flex-shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
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
        </>
      )}

      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="md:hidden max-h-[85vh]" style={{ backgroundColor: theme.background, borderColor }}>
          <DrawerHeader className="flex items-center justify-between px-4 pb-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <DrawerTitle style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>{tYourOrder}</DrawerTitle>
            <DrawerClose asChild>
              <button
                className="p-2 rounded-md"
                style={{ color: theme.foreground }}
              >
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            <CartItems {...props} isMobile />
          </div>

          {cart.length > 0 && (
            <div className="px-4 pb-4 pt-3 space-y-3 flex-shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
              <div className="flex justify-between text-base font-bold" style={{ color: theme.foreground }}>
                <span>{tTotal}</span>
                <span>€{cartTotal.toFixed(2)}</span>
              </div>
              <button
                className="w-full h-12 text-base rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 4px 16px 0 ${theme.primary}50` }}
                onClick={onCheckout}
              >
                {tPlaceOrder}
              </button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
})


const CartItems = memo(function CartItems(props: CartSidebarProps & { isMobile?: boolean }) {
  const { cart, isMobile, mutedForeground, tCartEmpty, getTranslatedText, onUpdateQuantity, theme, borderColor, cardBg, onRemoveItem } = props

  if (cart.length === 0) {
    return (
      <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
        <ShoppingCart className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} mx-auto ${isMobile ? 'mb-3' : 'mb-4'}`} style={{ color: mutedForeground }} />
        <p className={isMobile ? 'text-sm' : ''} style={{ color: mutedForeground }}>{tCartEmpty}</p>
      </div>
    )
  }

  return (
    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
      {cart.map((cartItem) => {
        const itemPrice = cartItem.calculatedPrice ?? (cartItem.item.base_price + (cartItem.variant?.price_modifier || 0))
        const optionsPrice = cartItem.selectedOptions.reduce((sum, opt) => sum + opt.price, 0)
        const totalPrice = (itemPrice + optionsPrice) * cartItem.quantity

        return (
          <div key={cartItem.id} className={`flex gap-3 p-3 ${isMobile ? 'rounded-xl' : 'rounded-lg'}`} style={{ backgroundColor: cardBg }}>
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${isMobile ? 'text-sm truncate' : ''}`} style={{ color: theme.foreground }}>
                {getTranslatedText(cartItem.item.id, 'name', cartItem.item.name)}
              </h4>
              {cartItem.variant && (
                <p className={isMobile ? 'text-xs truncate' : 'text-sm'} style={{ color: mutedForeground }}>{cartItem.variant.name}</p>
              )}
              {cartItem.selectedVariantInfos && cartItem.selectedVariantInfos.length > 0 && (
                <p className={isMobile ? 'text-xs truncate' : 'text-sm'} style={{ color: mutedForeground }}>
                  {cartItem.selectedVariantInfos.map(v => getTranslatedText(v.id, 'name', v.name, 'menu_item_variant')).join(', ')}
                </p>
              )}
              {cartItem.selectedOptions.length > 0 && (
                <p className={isMobile ? 'text-xs truncate' : 'text-sm'} style={{ color: mutedForeground }}>
                  + {cartItem.selectedOptions.map(o => o.name).join(', ')}
                </p>
              )}
              <p className={`font-semibold ${isMobile ? 'text-sm' : ''} mt-1`} style={{ color: theme.foreground }}>€{totalPrice.toFixed(2)}</p>
            </div>
            <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'} flex-shrink-0`}>
              <button
                className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} rounded-md flex items-center justify-center`}
                style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                onClick={() => onUpdateQuantity(cartItem.id, -1)}
              >
                <Minus className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
              </button>
              <span className={`${isMobile ? 'w-6 text-sm' : 'w-8'} text-center font-medium`} style={{ color: theme.foreground }}>{cartItem.quantity}</span>
              <button
                className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} rounded-md flex items-center justify-center`}
                style={{ border: `1px solid ${borderColor}`, color: theme.foreground }}
                onClick={() => onUpdateQuantity(cartItem.id, 1)}
              >
                <Plus className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
              </button>
              <button
                className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8 ml-1'} rounded-md flex items-center justify-center`}
                style={{ color: '#EF4444' }}
                onClick={() => onRemoveItem(cartItem.id)}
                title="Remove item"
              >
                <Trash2 className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
})
