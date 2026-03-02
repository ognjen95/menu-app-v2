import { getLocale } from 'next-intl/server'
import { NextIntlClientProvider } from 'next-intl'
import { LandingPageClient } from './landing-client'

export default async function LandingPage() {
  const locale = await getLocale()
  
  // Load public translations directly from the public folder
  const messages = (await import(`../messages/public/${locale}.json`)).default

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LandingPageClient />
    </NextIntlClientProvider>
  )
}