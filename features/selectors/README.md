# Selectors Feature

Reusable selector components for country, currency, and phone dialing code selection.

## Components

### CountrySelector
Displays a dropdown of active European countries with flags and native language names.

**Props:**
- `value?: string` - Selected country code (e.g., 'ES', 'GB', 'RS')
- `onValueChange?: (value: string) => void` - Callback when selection changes
- `placeholder?: string` - Placeholder text (default: 'Select country')
- `disabled?: boolean` - Disable the selector (default: false)

**Usage:**
```tsx
import { CountrySelector } from '@/features/selectors/components'

<CountrySelector 
  value={country}
  onValueChange={setCountry}
  placeholder="Choose your country"
/>
```

### CurrencySelector
Displays a dropdown of currencies from active countries with flags and country names.

**Props:**
- `value?: string` - Selected currency code (e.g., 'EUR', 'GBP', 'RSD')
- `onValueChange?: (value: string) => void` - Callback when selection changes
- `placeholder?: string` - Placeholder text (default: 'Select currency')
- `disabled?: boolean` - Disable the selector (default: false)

**Usage:**
```tsx
import { CurrencySelector } from '@/features/selectors/components'

<CurrencySelector 
  value={currency}
  onValueChange={setCurrency}
/>
```

### PhoneSelector
Displays a dropdown of countries with their international dialing codes.

**Props:**
- `value?: string` - Selected dialing code (e.g., '+34', '+44', '+381')
- `onValueChange?: (value: string) => void` - Callback when selection changes
- `placeholder?: string` - Placeholder text (default: 'Select country')
- `disabled?: boolean` - Disable the selector (default: false)

**Usage:**
```tsx
import { PhoneSelector } from '@/features/selectors/components'

<PhoneSelector 
  value={dialingCode}
  onValueChange={setDialingCode}
/>
```

## Data Source

All selectors use the `EUROPE_COUNTRIES` constant from `/lib/constants/countries.ts` and filter by `isActive: true`.

Currently active countries:
- Spain (ES) - España
- United Kingdom (GB) - English
- Serbia (RS) - Srbija

## Dependencies

- `@/components/ui/select` - Radix UI Select component
- `@/lib/constants/countries` - European countries data
