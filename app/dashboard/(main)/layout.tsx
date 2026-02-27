'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { type Locale } from '@/i18n/config'
import { createClient } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavbarActions } from '@/components/NavbarActions'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  QrCode,
  Globe,
  Settings,
  Users,
  MapPin,
  Languages,
  SidebarCloseIcon,
} from 'lucide-react'
import { MobileBottomNav } from './components/mobile-bottom-nav'
import { MoreOptionsSheet } from './components/more-options-sheet'
import { useScrollDirection } from '@/lib/hooks/use-scroll-direction'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

const navigationItems = [
  { key: 'overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { key: 'menu', href: '/dashboard/menu', icon: UtensilsCrossed },
  { key: 'orders', href: '/dashboard/orders', icon: ShoppingCart },
  { key: 'tablesQr', href: '/dashboard/tables', icon: QrCode },
  { key: 'website', href: '/dashboard/website/builder', icon: Globe },
]

const settingsItems = [
  { key: 'locations', href: '/dashboard/settings/locations', icon: MapPin },
  { key: 'languages', href: '/dashboard/settings/languages', icon: Languages },
  { key: 'team', href: '/dashboard/settings/team', icon: Users },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
]

// Update navigation to match actual routes

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const t = useTranslations('sidebar')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const { resolvedTheme, setTheme } = useTheme()
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const { isScrollingDown } = useScrollDirection({ threshold: 10, enabled: isMobile })
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [user, setUser] = useState<{
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null>(null)
  const supabase = createClient()

  // Load collapsed state and fetch user data after mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') {
      setCollapsed(true)
    }
    setMounted(true)

    // Fetch user data
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', authUser.id)
          .single()

        setUser({
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          email: authUser.email || '',
        })
      }
    }
    fetchUser()
  }, [supabase])

  // Persist collapsed state
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    }
  }, [collapsed, mounted])

  // Hide layout for full-screen builder
  const isBuilderPage = pathname === '/dashboard/website/builder'
  if (isBuilderPage) {
    return <>{children}</>
  }

  // Main navigation items for bottom bar (first 4)
  const mainNavItems = navigationItems.slice(0, 4)
  // All items for more sheet
  const allItems = [...navigationItems, ...settingsItems]

  const isNavItemActive = (href: string) => {
    return pathname === href || (href !== '/dashboard/overview' && pathname.startsWith(href))
  }

  // // Render minimal shell until mounted to prevent translation hydration mismatch
  // if (!mounted) {
  //   return (
  //     <div className="min-h-screen bg-background">
  //       <div className="lg:pl-[281px]">
  //         <main className="p-4 pb-24 lg:p-6 lg:pb-6">
  //           {children}
  //         </main>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed z-50 hidden lg:flex flex-col rounded-xl left-5 top-5 bottom-5 bg-gradient-to-b from-white to-white shadow-lg shadow-black/5 dark:from-white/[0.08] dark:to-white/[0.03] dark:shadow-none dark:backdrop-blur-sm border-border/30 dark:border-white/[0.1]',
          mounted ? 'transition-all duration-300 ease-in-out' : '',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-border/50',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}>
          <Link href="/dashboard" className={cn(
            'flex items-center gap-3 transition-all',
            collapsed ? 'justify-center' : ''
          )}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <h1 className='font-bold text-xl text-primary'>K</h1>
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}>Klopay<span className='text-primary'>.app</span></span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = isNavItemActive(item.href)
              const name = t(item.key)
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center rounded-xl px-3 py-3 font-medium transition-all duration-200',
                      collapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                    )}
                    title={collapsed ? name : undefined}
                  >
                    <item.icon className={cn(
                      'flex-shrink-0 transition-transform duration-200 h-5 w-5',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    {!collapsed && <span>{name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Settings section */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className={cn(
              "px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider overflow-hidden transition-all duration-300",
              collapsed ? "h-0 opacity-0 mb-0" : "h-auto opacity-100"
            )}>
              {t('settingsSection')}
            </p>
            <ul className="space-y-1.5">
              {settingsItems.map((item) => {
                const isActive = isNavItemActive(item.href)
                const name = t(item.key)
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center rounded-xl px-3 py-3 font-medium transition-all duration-200',
                        collapsed ? 'justify-center' : 'gap-3',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                      )}
                      title={collapsed ? name : undefined}
                    >
                      <item.icon className={cn(
                        'flex-shrink-0 transition-transform duration-200 h-5 w-5',
                        !isActive && 'group-hover:scale-110'
                      )} />
                      {!collapsed && <span>{name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Collapse Button at Bottom */}
        <div className="p-3 border-t border-border/50">
          <Button
            variant="ghost"
            className={cn(
              'w-full flex items-center rounded-xl py-3 h-auto font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200',
              collapsed ? 'justify-center px-3' : 'justify-start px-3 gap-3'
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            <SidebarCloseIcon className={cn(
              "h-5 w-5 flex-shrink-0 transition-transform duration-300",
              collapsed && "rotate-180"
            )} />
            {!collapsed && <span>{t('collapse')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        mounted ? 'transition-all duration-300 ease-in-out' : '',
        'lg:pl-[281px]',
        collapsed && 'lg:pl-[97px]'
      )}>
        {/* Top header - Desktop only */}
        <header className="sticky top-0 z-30 hidden lg:flex h-16 items-center gap-4 backdrop-blur px-6 border-border/50">
          <div className="flex-1" />
          <NavbarActions />
        </header>

        {/* Page content */}
        <main className="p-4 pb-24 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        items={mainNavItems}
        isNavItemActive={isNavItemActive}
        t={t}
        onMoreClick={() => setMoreSheetOpen(true)}
        isHidden={isScrollingDown}
      />

      {/* More Options Sheet */}
      <MoreOptionsSheet
        open={moreSheetOpen}
        onOpenChange={setMoreSheetOpen}
        items={allItems.slice(4)}
        isNavItemActive={isNavItemActive}
        t={t}
        locale={locale}
        resolvedTheme={resolvedTheme}
        setTheme={setTheme}
        user={user}
        mounted={mounted}
      />
    </div>
  )
}
