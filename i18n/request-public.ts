import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, CookieLocale } from './config'

export const getPublicLocaleFromCookies = async (tenantDefLocale?: string) => {
  // Get locale from PUBLIC_LOCALE cookie (separate from dashboard locale)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(CookieLocale.PUBLIC)?.value as string | undefined

  // Use cookie value if valid, otherwise default locale
  const locale: string = tenantDefLocale || localeCookie || defaultLocale

  let messages
  try {
    messages = (await import(`../messages/public/${locale}.json`)).default
  } catch {
    messages = (await import(`../messages/public/${defaultLocale}.json`)).default
  }

  return {
    locale,
    messages,
  }
}

/**
 * Public-facing i18n configuration
 * Used for public menu, website builder pages, etc.
 * Loads translations from messages/public/ directory
 * Uses 'PUBLIC_LOCALE' cookie to store language preference independently from dashboard
 */
export default getRequestConfig(async () => await getPublicLocaleFromCookies())