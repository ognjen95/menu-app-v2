'use client'

import { memo, useState, useEffect } from 'react'
import { X, ShoppingCart, Plus, Minus, Trash2, History, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import MenuButton from './menu-button'
import CurrencyFormat from '@/components/CurrencyFormat'
import { Currency } from '@/lib/types'

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

type OrderHistoryItem = {
  id: string
  order_number: string
  status: string
  type: string
  total: number
  currency: string
  placed_at: string | null
  created_at: string
  items: {
    id: string
    item_name: string
    variant_name: string | null
    quantity: number
    total_price: number
  }[]
}

interface CartSidebarProps {
  isOpen: boolean
  currency: string;
  cart: CartItem[]
  cartTotal: number
  theme: Theme
  cardBg: string
  borderColor: string
  mutedForeground: string
  tableId?: string
  tYourOrder: string
  tCartEmpty: string
  tTotal: string
  tPlaceOrder: string
  tHistory?: string
  tNoHistory?: string
  tOrderStatus?: Record<string, string>
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
    currency,
    cart,
    cartTotal,
    theme,
    borderColor,
    cardBg,
    mutedForeground,
    tableId,
    tYourOrder,
    tTotal,
    tPlaceOrder,
    tHistory = 'Order History',
    tNoHistory = 'No active orders for this table',
    tOrderStatus = {},
    getContrastColor,
    onClose,
    onCheckout,
  } = props || {};

  const [historyOpen, setHistoryOpen] = useState(false)
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Fetch order history when sidebar opens and tableId is available
  useEffect(() => {
    if (isOpen && tableId) {
      setHistoryLoading(true)
      fetch(`/api/public/orders/table-history?table_id=${tableId}`)
        .then(res => res.json())
        .then(data => {
          setOrderHistory(data.data?.orders || [])
        })
        .catch(err => {
          console.error('Failed to fetch order history:', err)
          setOrderHistory([])
        })
        .finally(() => setHistoryLoading(false))
    }
  }, [isOpen, tableId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return '#3B82F6'
      case 'accepted': return '#8B5CF6'
      case 'preparing': return '#F59E0B'
      case 'ready': return '#10B981'
      case 'served': return '#06B6D4'
      default: return mutedForeground
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        fullHeight
        className="w-full p-0 flex flex-col h-full overflow-hidden"
        style={{ backgroundColor: theme.background, borderColor }}
        renderCloseButton={() => (
          <Button variant={'ghost'} onClick={onClose}>
            <X className="h-4 w-4" style={{ color: theme.foreground }} />
          </Button>
        )}
      >
        <SheetHeader className="p-4 flex-shrink-0" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <SheetTitle style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}>
            {tYourOrder}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <CartItems {...props} />

          {/* Order History Section - Only show if tableId exists */}
          {tableId && (
            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
              <button
                className="w-full flex items-center justify-between py-2"
                onClick={() => setHistoryOpen(!historyOpen)}
                style={{ color: theme.foreground }}
              >
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <span className="font-medium">{tHistory}</span>
                  {orderHistory.length > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                    >
                      {orderHistory.length}
                    </span>
                  )}
                </div>
                {historyOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {historyOpen && (
                <div className="mt-3 space-y-3">
                  {historyLoading ? (
                    <div className="text-center py-4" style={{ color: mutedForeground }}>
                      <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mx-auto mb-2" />
                    </div>
                  ) : orderHistory.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: mutedForeground }}>
                      {tNoHistory}
                    </p>
                  ) : (
                    orderHistory.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: cardBg }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm" style={{ color: theme.foreground }}>
                            #{order.order_number}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `${getStatusColor(order.status)}20`,
                                color: getStatusColor(order.status)
                              }}
                            >
                              {tOrderStatus[order.status] || order.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm" style={{ color: mutedForeground }}>
                              <span>{item.quantity}x {item.item_name}</span>
                              <span>€{item.total_price.toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs" style={{ color: mutedForeground }}>
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                          <div className="flex items-center gap-1 text-xs" style={{ color: mutedForeground }}>
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(order.placed_at || order.created_at)}</span>
                          </div>
                          <span className="font-semibold text-sm" style={{ color: theme.foreground }}>
                            <CurrencyFormat value={order.total} currency={currency as Currency} />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 space-y-4 flex-shrink-0" style={{ borderTop: `1px solid ${borderColor}` }}>
            <div className="flex justify-between text-lg font-bold" style={{ color: theme.foreground }}>
              <span>{tTotal}</span>
              <CurrencyFormat value={cartTotal} currency={currency as Currency} />
            </div>
            <MenuButton
              theme={theme}
              onClick={onCheckout}
            >
              {tPlaceOrder}
            </MenuButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
