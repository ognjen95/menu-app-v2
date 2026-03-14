'use client'

import { User } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase-client'
import { ThemeToggle } from './theme-toggle'
import { AppLanguagesSwitcher } from './language-switcher'

/**
 * Navbar Action Buttons
 * Language Switcher, Theme Toggle, and Notifications
 * All use consistent ghost button styling
 */
export function NavbarActions() {
  const [user, setUser] = useState<{
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null>(null)

  const supabase = createClient()

  useEffect(() => {
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

  return (
    <div className="flex items-center gap-1">
      {/* Language Switcher */}
      <AppLanguagesSwitcher />

      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Notifications */}
      {/* <Button variant="ghost" size="icon">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button> */}

      {/* Profile */}
      <Link href="/dashboard/settings/profile">
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
          <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ||
              user?.email?.slice(0, 2).toUpperCase() ||
              <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      </Link>
    </div>
  )
}
