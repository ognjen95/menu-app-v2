'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
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
  X,
  ChevronLeft,
  Store,
  ChefHat,
  Bell,
  SidebarIcon,
  SidebarOpenIcon,
  SidebarCloseIcon,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Kitchen', href: '/dashboard/kitchen', icon: ChefHat },
  { name: 'Tables & QR', href: '/dashboard/tables', icon: QrCode },
  // { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Website', href: '/dashboard/website/builder', icon: Globe },
  // { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

const settingsNavigation = [
  { name: 'Locations', href: '/dashboard/settings/locations', icon: MapPin },
  { name: 'Team', href: '/dashboard/settings/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// Update navigation to match actual routes

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapsed state from localStorage after mount
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
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-card shadow-lg',
          mounted ? 'transition-all duration-300 ease-in-out' : '',
          collapsed ? 'w-[72px]' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
              <Store className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight">QR Menu</span>
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
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard/overview' && pathname.startsWith(item.href))
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-200',
                      collapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn(
                      'flex-shrink-0 transition-transform duration-200',
                      collapsed ? 'h-5 w-5' : 'h-5 w-5',
                      !isActive && 'group-hover:scale-110'
                    )} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Settings section */}
          <div className="mt-6 pt-4 border-t border-border/50">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </p>
            )}
            <ul className="space-y-1.5">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard/settings' && pathname.startsWith(item.href))
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-3 font-medium transition-all duration-200',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={cn(
                        'flex-shrink-0 transition-transform duration-200',
                        collapsed ? 'h-5 w-5' : 'h-5 w-5',
                        !isActive && 'group-hover:scale-110'
                      )} />
                      {!collapsed && <span>{item.name}</span>}
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
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        mounted ? 'transition-all duration-300 ease-in-out' : '',
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
      )}>
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4  bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
              3
            </span>
          </Button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
