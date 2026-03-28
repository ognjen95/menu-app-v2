# Tracking Service

GDPR-compliant Google Analytics 4 tracking with cookie consent management.

## Features

- **Google Analytics 4** - Modern gtag.js implementation
- **Cookie Consent** - LocalStorage-based consent management (GDPR compliant)
- **Consent Mode v2** - Google's consent mode for privacy-first tracking
- **Do Not Track (DNT)** - Honors browser DNT setting
- **IP Anonymization** - Enabled by default for EU compliance
- **React Provider** - Context-based access throughout the app
- **Auto Page Views** - Automatic tracking on route changes
- **Type-safe Events** - Typed event methods matching GA4 spec
- **Cookie Banner** - Ready-to-use Shadcn UI components with translations (EN, ES, SR)

## Setup

### 1. Add Environment Variable

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Add Provider to Layout

```tsx
// app/layout.tsx
import { TrackingProvider, CookieBanner } from '@/lib/services/tracking'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TrackingProvider>
          {children}
          <CookieBanner />
        </TrackingProvider>
      </body>
    </html>
  )
}
```

### 3. (Optional) Configure Provider

```tsx
<TrackingProvider
  measurementId="G-XXXXXXXXXX"  // Override env variable
  debug={true}                   // Enable console logging
  anonymizeIp={true}             // Recommended for EU (default: true)
  consentVersion="1.0"           // Bump to re-prompt users
>
```

## Usage

### Track Events

```tsx
import { useTracking } from '@/lib/services/tracking'

function OrderButton() {
  const { trackEvent } = useTracking()
  
  const handleOrder = () => {
    trackEvent('purchase', {
      transaction_id: 'T12345',
      value: 25.99,
      currency: 'EUR',
      items: [{
        item_id: 'SKU123',
        item_name: 'Pizza Margherita',
        price: 12.99,
        quantity: 2
      }]
    })
  }
  
  return <Button onClick={handleOrder}>Place Order</Button>
}
```

### Common Events

```tsx
const { trackEvent } = useTracking()

// Page interactions
trackEvent('click', { element: 'cta_button' })
trackEvent('scroll', { percent_scrolled: 90 })

// E-commerce
trackEvent('view_item', { items: [...] })
trackEvent('add_to_cart', { items: [...], value: 10.99, currency: 'EUR' })
trackEvent('begin_checkout', { items: [...], value: 99.99 })
trackEvent('purchase', { transaction_id: 'T123', value: 99.99 })

// Engagement
trackEvent('login', { method: 'email' })
trackEvent('sign_up', { method: 'google' })
trackEvent('search', { search_term: 'pizza' })
```

### Check Consent State

```tsx
import { useTracking } from '@/lib/services/tracking'

function AnalyticsStatus() {
  const { consent, hasConsent, isEnabled } = useTracking()
  
  return (
    <div>
      <p>Analytics: {consent.analytics ? 'Enabled' : 'Disabled'}</p>
      <p>Marketing: {consent.marketing ? 'Enabled' : 'Disabled'}</p>
      <p>Has decided: {hasConsent !== null ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### Set User ID

```tsx
import { setUserId, setUserProperties } from '@/lib/services/tracking'

// After login
setUserId('user_123')
setUserProperties({
  subscription_plan: 'pro',
  tenant_type: 'restaurant'
})

// On logout
setUserId(null)
```

## Cookie Banner Components

### Full Banner with Settings

```tsx
import { CookieBanner } from '@/lib/services/tracking'

<CookieBanner
  privacyPolicyUrl="/privacy-policy"
  position="bottom"           // 'bottom' | 'bottom-left' | 'bottom-right'
  showSettingsButton={true}   // Show granular settings
/>
```

### Minimal Banner

```tsx
import { MinimalCookieBanner } from '@/lib/services/tracking'

<MinimalCookieBanner privacyPolicyUrl="/privacy-policy" />
```

### Cookie Settings Button (for footer)

```tsx
import { CookieSettingsButton } from '@/lib/services/tracking'

// As link
<CookieSettingsButton variant="link" />

// As button
<CookieSettingsButton variant="button" />
```

## Consent Categories

| Category | Description | Default |
|----------|-------------|---------|
| `necessary` | Required for site functionality | Always `true` |
| `analytics` | Google Analytics tracking | `false` |
| `marketing` | Ads, remarketing, third-party | `false` |

## API Reference

### `useTracking()` Hook

```tsx
const {
  // State
  consent,        // Current consent state
  hasConsent,     // null = not decided, true/false = decided
  isInitialized,  // GA is loaded and ready
  isEnabled,      // Analytics tracking is active
  
  // Actions
  acceptAll,      // Accept all cookies
  rejectAll,      // Reject optional cookies
  updateConsent,  // Update specific categories
  resetConsent,   // Clear and re-prompt
  
  // Tracking
  trackEvent,     // Track custom event
  trackPageView,  // Manual page view
} = useTracking()
```

### Consent Manager Utilities

```tsx
import { 
  getConsentState,     // Get current state from localStorage
  hasConsentDecision,  // Check if user has decided
  hasConsentFor,       // Check specific category
} from '@/lib/services/tracking'
```

## Architecture

```
/lib/services/tracking/
├── index.ts              # Public exports
├── types.ts              # TypeScript types
├── consent-manager.ts    # LocalStorage consent handling
├── google-analytics.ts   # GA4 gtag implementation
├── tracking-provider.tsx # React context provider
├── cookie-banner.tsx     # UI components
└── README.md             # This file
```

## GDPR Compliance

This service is designed to be fully GDPR compliant:

| Requirement | Implementation |
|-------------|----------------|
| Consent before tracking | ✅ No scripts load until user consents |
| Do Not Track (DNT) | ✅ Honors browser DNT setting |
| IP Anonymization | ✅ Enabled by default (`anonymizeIp: true`) |
| Granular consent | ✅ Separate analytics/marketing categories |
| Consent withdrawal | ✅ `CookieSettingsButton` for footer |
| Consent audit trail | ✅ Timestamp stored with consent |
| Consent versioning | ✅ Bump `consentVersion` to re-prompt |

## Best Practices

1. **No tracking without consent** - Scripts only load after explicit consent
2. **LocalStorage for consent** - Avoids cookie consent paradox
3. **Granular consent** - Separate analytics vs marketing
4. **Consent timestamp** - For compliance auditing
5. **Consent versioning** - Re-prompt when policy changes
6. **DNT honored** - Respects browser Do Not Track setting

## Debugging

Enable debug mode to see tracking logs:

```tsx
<TrackingProvider debug={true}>
```

Console will show:
- `[GA4] Initialized successfully with: G-XXXXXXXXXX`
- `[GA4] Event tracked: page_view {...}`
- `[GA4] Consent updated: {...}`
