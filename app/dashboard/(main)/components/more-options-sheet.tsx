'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sun, Moon, type LucideIcon } from 'lucide-react'
import { locales, localeLabels, type Locale } from '@/i18n/config'

interface NavItem {
  key: string
  href: string
  icon: LucideIcon
}

interface User {
  full_name: string | null
  avatar_url: string | null
  email: string
}

interface MoreOptionsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavItem[]
  isNavItemActive: (href: string) => boolean
  t: (key: string) => string
  locale: Locale
  resolvedTheme: string | undefined
  setTheme: (theme: string) => void
  user: User | null
  mounted: boolean
}

export function MoreOptionsSheet({
  open,
  onOpenChange,
  items,
  isNavItemActive,
  t,
  locale,
  resolvedTheme,
  setTheme,
  user,
  mounted,
}: MoreOptionsSheetProps) {
  const router = useRouter()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-3xl">
        <SheetHeader className="mb-6">
          <SheetTitle>{t('moreOptions') || 'More Options'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Navigation items */}
          <div className="space-y-2">
            {items.map((item) => {
              const isActive = isNavItemActive(item.href)
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onOpenChange(false)
                    setTimeout(() => router.push(item.href), 150)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 w-full text-left',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{t(item.key)}</span>
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Theme Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground px-4">
              Theme
            </label>
            <div className="flex gap-2 px-4">
              <Button
                variant={mounted && resolvedTheme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="flex-1 gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={mounted && resolvedTheme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="flex-1 gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground px-4">
              {t('languages') || 'Language'}
            </label>
            <Select
              value={locale}
              onValueChange={(newLocale) => {
                document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
                onOpenChange(false)
                setTimeout(() => {
                  window.location.reload()
                }, 150)
              }}
            >
              <SelectTrigger className="mx-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {localeLabels[loc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profile */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onOpenChange(false)
                setTimeout(() => router.push('/dashboard/settings'), 150)
              }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-foreground w-full text-left"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || 'User'} />
                <AvatarFallback className="text-xs">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{user?.full_name || t('profile')}</span>
                {user?.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
              </div>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
