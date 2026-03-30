// =============================================================================
// Tracking Service - Public API
// =============================================================================

// Provider & Hook
export { TrackingProvider, useTracking, useTrackingOptional } from './tracking-provider'

// Cookie Banner Components
export { CookieBanner, MinimalCookieBanner, CookieSettingsButton } from './cookie-banner'
export {ConversionTracking} from './constants'
// Types
export type {
  ConsentState,
  ConsentCategory,
  TrackingConfig,
  TrackingContextValue,
  GA4EventName,
  GA4Item,
  BaseEventParams,
  EcommerceEventParams,
  PageViewParams,
} from './types'

export { DEFAULT_CONSENT_STATE } from './types'

// Consent utilities (for advanced use cases)
export {
  getConsentState,
  hasConsentDecision,
  hasConsentFor,
  isBrowser,
} from './consent-manager'

// GA utilities (for advanced use cases)
export {
  setUserId,
  setUserProperties,
  trackConversion,
} from './google-analytics'
