import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, CookieLocale, type Locale } from '@/i18n/config'

export function getValidLocaleFromParam(param: string | null): Locale {
  if (param && locales.includes(param as Locale)) {
    return param as Locale
  }
  return defaultLocale as Locale
}

export function handleLocaleFromQueryParam(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const localeParam = request.nextUrl.searchParams.get('locale')
  const existingCookie = request.cookies.get(CookieLocale.APP)?.value
  
  // Only set if no existing cookie AND there's a locale param
  if (!existingCookie && localeParam) {
    const validLocale = getValidLocaleFromParam(localeParam)
    response.cookies.set(CookieLocale.APP, validLocale, {
      path: '/',
      maxAge: 31536000,
    })
  }
  
  return response
}
