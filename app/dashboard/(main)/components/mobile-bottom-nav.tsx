'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, MoreVertical, type LucideIcon } from 'lucide-react'

interface NavItem {
  key: string
  href: string
  icon: LucideIcon
}

interface MobileBottomNavProps {
  items: NavItem[]
  isNavItemActive: (href: string) => boolean
  t: (key: string) => string
  onMoreClick: () => void
  isHidden?: boolean
}

export function MobileBottomNav({
  items,
  isNavItemActive,
  t,
  onMoreClick,
  isHidden = false,
}: MobileBottomNavProps) {
  return (
    <nav className={cn(
      "fixed bottom-4 left-4 right-4 z-40 lg:hidden transition-transform duration-300 ease-in-out",
      isHidden && "translate-y-[calc(100%+2rem)]"
    )}>
      {/* Blur background */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl rounded-full border border-border/50 shadow-lg" />

      {/* Navigation content */}
      <div className="relative flex items-center justify-between px-4 py-2 h-16">
        {/* Main nav items */}
        {items.map((item) => {
          const isActive = isNavItemActive(item.href)
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center justify-center flex-1 transition-all duration-300 active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={t(item.key)}
            >
              <div className={cn(
                'p-2 rounded-2xl transition-all duration-300',
                isActive && 'bg-primary/20 scale-110'
              )}>
                <item.icon className="h-6 w-6 transition-transform duration-300 hover:scale-125" />
              </div>
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={onMoreClick}
          className="flex items-center justify-center flex-1 transition-all duration-300 text-muted-foreground hover:text-foreground active:scale-95"
          title={t('more') || 'More'}
        >
          <div className="p-2 rounded-2xl transition-all duration-300 hover:bg-accent/50">
            <Menu className="h-6 w-6 transition-transform duration-300 hover:scale-125" />
          </div>
        </button>
      </div>
    </nav>
  )
}
