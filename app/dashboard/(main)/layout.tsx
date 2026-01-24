'use client'

import { useState } from 'react'
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
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Menu', href: '/dashboard/menu', icon: UtensilsCrossed },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Kitchen', href: '/dashboard/kitchen', icon: ChefHat },
  { name: 'Tables & QR', href: '/dashboard/tables', icon: QrCode },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { name: 'Website', href: '/dashboard/website', icon: Globe },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
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
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">QR Menu</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="mx-auto">
              <Store className="h-6 w-6 text-primary" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard/overview' && pathname.startsWith(item.href))
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Settings section */}
          <div className="mt-6 pt-6 border-t mx-2">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Settings
              </p>
            )}
            <ul className="space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard/settings' && pathname.startsWith(item.href))
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Theme toggle at bottom */}
        <div className="border-t p-4">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1" />
          
          {/* User menu would go here */}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
