import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

/**
 * Public-facing i18n configuration
 * Used for public menu, website builder pages, etc.
 * Loads translations from messages/public/ directory
 * Uses 'PUBLIC_LOCALE' cookie to store language preference independently from dashboard
 */
export default getRequestConfig(async () => {
  // Get locale from PUBLIC_LOCALE cookie (separate from dashboard locale)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('PUBLIC_LOCALE')?.value as Locale | undefined
  
  // Use cookie value if valid, otherwise default locale
  const locale: Locale = localeCookie && locales.includes(localeCookie) 
    ? localeCookie 
    : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/public/${locale}.json`)).default,
  }
})
