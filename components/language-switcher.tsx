'use client'

import { useLocale } from 'next-intl'
import { locales, localeLabels, type Locale } from '@/i18n/config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  sr: '🇷🇸',
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale

  const setLocale = (newLocale: Locale) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <span className="text-lg">{localeFlags[locale]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
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
            <span className="text-lg mr-2">{localeFlags[loc]}</span>
            {localeLabels[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
