import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale, CookieLocale } from './config'

export default getRequestConfig(async () => {
  // Get locale from cookie only (consistent between server and client)
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get(CookieLocale.APP)?.value as Locale | undefined
  
  const locale: string = localeCookie || defaultLocale

  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch {
    messages = (await import(`../messages/${defaultLocale}.json`)).default
  }
  return {
    locale,
    messages,
  }
})
