'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavbarActions } from '@/components/NavbarActions'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  QrCode,
  Package,
  Globe,
  BarChart3,
  Settings,
  Users,
  MapPin,
  Menu,
  Languages,
  X,
  ChevronLeft,
  Store,
  SidebarIcon,
  SidebarOpenIcon,
  SidebarCloseIcon,
  Smartphone,
} from 'lucide-react'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state after mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') {
      setCollapsed(true)
    }
    setMounted(true)
  }, [])

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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}

      <aside
        className={cn(
          'fixed z-50 flex flex-col rounded-xl left-3 top-3 bottom-3 right-3 bg-background/95 backdrop-blur-xl lg:right-auto lg:left-5 lg:top-5 lg:bottom-5 lg:bg-gradient-to-b lg:from-white lg:to-white lg:shadow-lg lg:shadow-black/5 dark:lg:from-white/[0.08] dark:lg:to-white/[0.03] dark:lg:shadow-none dark:lg:backdrop-blur-sm lg:border-border/30 dark:lg:border-white/[0.1]',
          mounted ? 'transition-all duration-300 ease-in-out' : '',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+24px)] lg:translate-x-0'
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
              {/* <Store className="h-5 w-5 text-primary" /> */}
              <h1 className='font-bold text-xl text-primary'>K</h1>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight">Klopay<span className='text-primary'>.app</span></span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard/overview' && pathname.startsWith(item.href))
              const name = t(item.key)
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-200',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                    )}
                    title={collapsed ? name : undefined}
                  >
                    <item.icon className={cn(
                      'flex-shrink-0 transition-transform duration-200',
                      collapsed ? 'h-5 w-5' : 'h-5 w-5',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    {<span className={cn({
                      'md:hidden': collapsed
                    })}
                    >{name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Settings section */}
          <div className="mt-6 pt-4 border-t border-border/50">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('settingsSection')}
              </p>
            )}
            <ul className="space-y-1.5">
              {settingsItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard/settings' && pathname.startsWith(item.href))
                const name = t(item.key)
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-200',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                      )}
                      title={collapsed ? name : undefined}
                    >
                      <item.icon className={cn(
                        'flex-shrink-0 transition-transform duration-200',
                        collapsed ? 'h-5 w-5' : 'h-5 w-5',
                        !isActive && 'group-hover:scale-110'
                      )} />
                      {<span className={cn({
                        'md:hidden': collapsed
                      })}
                      >{name}</span>}                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Collapse Button at Bottom */}
        <div className="p-3 border-t border-border/50">
          {/* Collapse Button */}
          <Button
            variant="ghost"
            className={cn(
              'w-full hidden lg:flex items-center gap-3 rounded-xl py-3 h-auto font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200',
              collapsed ? 'justify-center px-0' : 'justify-start px-3'
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <SidebarOpenIcon className="h-5 w-5" />
            ) : (
              <>
                <SidebarCloseIcon className="h-5 w-5" />
                <span>{t('collapse')}</span>
              </>
            )}
          </Button>
        </div>
      </aside>


      {/* Main content */}
      <div className={cn(
        mounted ? 'transition-all duration-300 ease-in-out' : '',
        collapsed ? 'lg:pl-[97px]' : 'lg:pl-[281px]'
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4   backdrop-blur px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Language, Theme, Notifications */}
          <NavbarActions />
        </header>

        {/* Page content */}
        <main className="p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
