import React from 'react'

const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

const MenuButton = ({ children, theme, setCartOpen }: { children: React.ReactNode, theme: any, setCartOpen: (open: boolean) => void }) => {
  return (
    <button
      className="w-full h-14 text-lg rounded-full font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
      style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary), boxShadow: `0 8px 24px 0 ${theme.primary}50` }}
      onClick={() => setCartOpen(true)}
    >
      {children}
    </button>
  )
}

export default MenuButton