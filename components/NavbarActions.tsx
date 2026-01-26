'use client'

import { Bell, Moon, Sun, Globe, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { locales, localeLabels, type Locale } from '@/i18n/config'
import { createClient } from '@/lib/supabase-client'

/**
 * Navbar Action Buttons
 * Language Switcher, Theme Toggle, and Notifications
 * All use consistent ghost button styling
 */
export function NavbarActions() {
  const { resolvedTheme, setTheme } = useTheme()
  const locale = useLocale() as Locale
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<{
    full_name: string | null
    avatar_url: string | null
    email: string
  } | null>(null)
  const supabase = createClient()

  useEffect(() => {
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

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const setLocale = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-1">
      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Globe className="h-4 w-4" />
            <span className="sr-only">Switch language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className={locale === loc ? 'bg-muted' : ''}
            >
              {localeLabels[loc]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <Button variant="ghost" size="icon" onClick={toggleTheme}>
        {mounted ? (
          resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Notifications */}
      <Button variant="ghost" size="icon">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>

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
