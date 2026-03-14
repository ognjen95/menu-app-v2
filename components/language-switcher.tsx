'use client'

import { useLocale } from 'next-intl'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAllActiveLanguages, useAllActivePublicLanguages, useTenantPublicLanguages } from '@/features/translations'
import { Language } from '@/lib/types'
import { CookieLocale } from '@/i18n/config'

interface LanguageSwitcherProps {
  languages: Language[]
  isPublic: boolean
}

function LanguageSwitcherComponent({ languages, isPublic }: LanguageSwitcherProps) {
  const locale = useLocale()
  const cookieKey = isPublic ? CookieLocale.PUBLIC : CookieLocale.APP

  const setLocale = (newLocale: string) => {
    document.cookie = `${cookieKey}=${newLocale};path=/;max-age=31536000`

    const url = new URL(window.location.href)
    window.location.href = url.toString()
  }

  const getCountryFlag = (localeCode: string) => {
    const country = languages.find((lang) => lang.code === localeCode)
    return country?.flag_emoji || '🌐'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="gap-1.5">
          <span className="text-xl">{getCountryFlag(locale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={locale === lang.code ? 'bg-muted' : ''}
          >
            <span className="text-lg mr-2">{getCountryFlag(lang.code)}</span>
            {lang.native_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const AppLanguagesSwitcher = () => {
  const { data: allLangsData } = useAllActiveLanguages()
  const languages = allLangsData?.data?.languages || []

  return <LanguageSwitcherComponent languages={languages} isPublic={false} />
}

export const PublicLanguagesSwitcher = () => {
  const { data: allLangsData } = useAllActivePublicLanguages()
  const languages = allLangsData?.data?.languages || []

  return <LanguageSwitcherComponent languages={languages} isPublic={true} />
}

export const TenantPublicLanguagesSwitcher = ({ tenantId }: { tenantId: string }) => {
  const { data: tenantLangsData } = useTenantPublicLanguages(tenantId)
  const languages = tenantLangsData?.data?.languages.filter((lang) => lang.is_enabled)?.map((lang) => lang.language) || []

  return <LanguageSwitcherComponent languages={languages} isPublic={true} />
}
