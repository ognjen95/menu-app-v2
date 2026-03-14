# Translation Rules

## Core Principle
**Everything needs to be translated.** All user-facing text must have translations in all supported languages.

## Message File Organization

### Dashboard & Landing Routes
**Location:** `/messages/[locale].json`

**Routes:**
- `/` - Landing page
- `/dashboard/*` - All dashboard routes
- `/auth/*` - Authentication routes
- `/onboarding/*` - Onboarding flow
- `/forgot-password/*` - Password recovery

**Supported Locales:**
- `en.json` - English
- `es.json` - Spanish
- `sr.json` - Serbian

**Usage:**
```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('section.subsection')
return <h1>{t('title')}</h1>
```

### Public Menu & Website Routes
**Location:** `/messages/public/[locale].json`

**Routes:**
- `/m/[slug]` - Public menu preview
- `/site/[subdomain]` - Public website preview
- Any public-facing pages

**Supported Locales:**
- `en.json` - English
- `es.json` - Spanish
- `sr.json` - Serbian
- `it.json` - Italian
- `ru.json` - Russian
- `fr.json` - French

**Usage:**
```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('section')
return <h1>{t('title')}</h1>
```

## Translation Structure

### Dashboard Messages (`/messages/[locale].json`)
```json
{
  "common": { ... },
  "auth": { ... },
  "onboarding": { ... },
  "dashboard": { ... },
  "menu": { ... },
  "orders": { ... },
  "checkout": { ... },
  "variants": { ... }
}
```

### Public Messages (`/messages/public/[locale].json`)
```json
{
  "landing": { ... },
  "menu": { ... },
  "gallery": { ... },
  "allergens": { ... },
  "dietary": { ... }
}
```

## Checklist Before Committing

- [ ] All user-facing text has translation keys
- [ ] Text is in the correct message file:
  - Dashboard/Auth routes → `/messages/[locale].json`
  - Public menu/site routes → `/messages/public/[locale].json`
- [ ] All supported locales have the translation:
  - Dashboard: `en`, `es`, `sr`
  - Public: `en`, `es`, `sr`, `it`, `ru`, `fr`
- [ ] Translation keys follow naming convention: `section.subsection.key`
- [ ] No hardcoded strings in components (except for technical values)

## Adding New Translations

1. **Identify the route type:**
   - Dashboard/Auth/Landing → use `/messages/[locale].json`
   - Public menu/site → use `/messages/public/[locale].json`

2. **Add to all supported locales:**
   - Dashboard: Add to `en.json`, `es.json`, `sr.json`
   - Public: Add to `en.json`, `es.json`, `sr.json`, `it.json`, `ru.json`, `fr.json`

3. **Use consistent key structure:**
   ```json
   {
     "section": {
       "subsection": {
         "key": "Translation text"
       }
     }
   }
   ```

4. **Update component to use translation:**
   ```typescript
   const t = useTranslations('section.subsection')
   return <span>{t('key')}</span>
   ```

## Common Mistakes to Avoid

❌ **Don't:** Hardcode strings in components
```typescript
return <h1>Welcome</h1>  // ❌ Not translated
```

✅ **Do:** Use translation keys
```typescript
const t = useTranslations('common')
return <h1>{t('welcome')}</h1>  // ✅ Translated
```

❌ **Don't:** Add dashboard text to public messages
```json
// messages/public/en.json
{ "dashboard": { "title": "..." } }  // ❌ Wrong file
```

✅ **Do:** Use correct file location
```json
// messages/en.json
{ "dashboard": { "title": "..." } }  // ✅ Correct file
```

❌ **Don't:** Forget to translate for all locales
```json
// Only added to en.json
// ❌ Missing es.json, sr.json, etc.
```

✅ **Do:** Add to all supported locales
```json
// Added to en.json, es.json, sr.json, it.json, ru.json, fr.json
// ✅ Complete translations
```
