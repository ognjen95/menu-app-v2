import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { UserRoles } from '@/lib/api/route-handlers'
import DashboardLayoutClient from './layout-client'

const navigationItems = [
  { key: 'overview', href: '/dashboard/overview' },
  { key: 'menu', href: '/dashboard/menu' },
  { key: 'orders', href: '/dashboard/orders' },
  { key: 'tablesQr', href: '/dashboard/tables' },
  { key: 'website', href: '/dashboard/website/builder' },
]

const settingsItems = [
  { key: 'locations', href: '/dashboard/settings/locations' },
  { key: 'languages', href: '/dashboard/settings/languages' },
  { key: 'team', href: '/dashboard/settings/team' },
  { key: 'settings', href: '/dashboard/settings' },
]

// Role-based navigation permissions
const rolePermissions: Record<UserRoles, string[]> = {
  owner: ['overview', 'menu', 'orders', 'tablesQr', 'website', 'locations', 'languages', 'team', 'settings'],
  manager: ['overview', 'menu', 'orders', 'tablesQr', 'website', 'locations', 'languages', 'team'],
  staff: ['overview', 'orders'],
  kitchen: ['overview', 'orders'],
  waiter: ['overview', 'orders', 'tablesQr'],
}

const getPermittedNavItems = (role: UserRoles | null): string[] => {
  if (!role) return []
  return rolePermissions[role] || []
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch user role on server
  let userRole: UserRoles | null = null

  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', authUser.id)
        .single()

      userRole = (tenantUser?.role as UserRoles) || null
    }
  } catch (error) {
    console.error('Failed to fetch user role:', error)
  }

  // Get sidebar collapsed state from cookie
  const cookieStore = await cookies()
  const collapsedCookie = cookieStore.get('sidebar-collapsed')
  const initialCollapsed = collapsedCookie?.value === 'true'

  // Filter navigation items based on role
  const permittedKeys = getPermittedNavItems(userRole)
  const filteredNavItems = navigationItems.filter(item => permittedKeys.includes(item.key))
  const filteredSettingsItems = settingsItems.filter(item => permittedKeys.includes(item.key))

  return (
    <DashboardLayoutClient
      filteredNavItems={filteredNavItems}
      filteredSettingsItems={filteredSettingsItems}
      initialCollapsed={initialCollapsed}
    >
      {children}
    </DashboardLayoutClient>
  )
}
