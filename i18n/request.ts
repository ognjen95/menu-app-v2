import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  // Get locale from cookie only (consistent between server and client)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined
  
  // Use cookie value if valid, otherwise default locale
  const locale: Locale = localeCookie && locales.includes(localeCookie) 
    ? localeCookie 
    : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
