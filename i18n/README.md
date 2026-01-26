# Internationalization (i18n)

This project uses [next-intl](https://next-intl-docs.vercel.app/) for internationalization with Next.js 14 App Router.

## Supported Languages

- **English** (`en`) - Default
- **Spanish** (`es`)

## Structure

```
/i18n/
├── config.ts          # Locale configuration
├── request.ts         # Server-side i18n setup
└── README.md          # This file

/messages/
├── en.json            # English translations
└── es.json            # Spanish translations
```

## Usage

### Server Components

```tsx
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('namespace')
  return <h1>{t('key')}</h1>
}
```

### Client Components

```tsx
'use client'
import { useTranslations } from 'next-intl'

export default function Component() {
  const t = useTranslations('namespace')
  return <h1>{t('key')}</h1>
}
```

## Switching Languages

Use the `LanguageSwitcher` component:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher'

<LanguageSwitcher />
```

The language preference is stored in a cookie (`NEXT_LOCALE`).

## Adding New Translations

1. Add new keys to `/messages/en.json`
2. Add corresponding translations to `/messages/es.json`
3. Use the translation key in your component with `t('namespace.key')`

## Adding New Languages

1. Add the locale to `/i18n/config.ts`:
   ```ts
   export const locales = ['en', 'es', 'fr'] as const
   export const localeLabels = {
     en: 'English',
     es: 'Español',
     fr: 'Français',
   }
   ```

2. Create `/messages/fr.json` with all translations

## Message Structure

Messages are organized by feature/page:

- `common` - Shared translations (buttons, loading states, etc.)
- `auth` - Login, signup, password reset
- `onboarding` - Business setup wizard
- `dashboard` - Dashboard pages
- `order` - Order success/cancel pages
- `subscribe` - Subscription pages
- `navigation` - Menu navigation items
- `settings` - Settings pages
