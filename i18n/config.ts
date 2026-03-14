// !!! HERE ENABLE LANGUAGES FOR DASHBOARD TRANSLATIONS (LEGACY)
// * Supported locales in Landing Page and Dashboard (APP Specific)
export const locales = ['en', 'es', 'sr'] as const
// * Supported locales in Tenants Websites and Menus (PUBLIC - Client Facing)
export const publicLocales = [...locales, 'fr', 'it', 'ru']

export type Locale = (typeof locales)[number]
export type PublicLocale = (typeof publicLocales)[number]

// Default locale
// ! NEVER DELETE !!!!!!!!
export const defaultLocale: Locale | PublicLocale = 'en'

if (!defaultLocale) {
  throw new Error('Missing DEFAULT LOCALE')
}

export const CookieLocale = {
  APP: 'NEXT_LOCALE',
  PUBLIC: 'NEXT_PUBLIC_LOCALE',
} as const
