'use client'

import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'

interface PublicIntlProviderProps {
  locale: string
  messages: Record<string, any>
  children: ReactNode
}

/**
 * Public-facing internationalization provider
 * Used for public menu, website builder, and other public pages
 * Separate from dashboard i18n to avoid mixing translations
 */
export function PublicIntlProvider({ locale, messages, children }: PublicIntlProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
