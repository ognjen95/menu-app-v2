// Supported locales
export const locales = ['en', 'es', 'sr'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'en'

// Locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  sr: 'Srpski',
}
