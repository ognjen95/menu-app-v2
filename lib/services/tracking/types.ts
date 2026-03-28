// =============================================================================
// Tracking Service Types
// =============================================================================

/**
 * Consent categories for GDPR compliance
 */
export type ConsentCategory = 'necessary' | 'analytics' | 'marketing'

/**
 * User consent state stored in localStorage
 */
export interface ConsentState {
  necessary: boolean    // Always true - required for site functionality
  analytics: boolean    // Google Analytics, page views, events
  marketing: boolean    // Ads, remarketing, third-party tracking
  timestamp: number     // Unix timestamp when consent was given/updated
  version: string       // Consent policy version for re-prompting on updates
}

/**
 * Default consent state (no consent given)
 */
export const DEFAULT_CONSENT_STATE: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
  version: '1.0',
}

/**
 * Tracking provider configuration
 */
export interface TrackingConfig {
  measurementId: string          // GA4 Measurement ID (G-XXXXXXXXXX)
  debug?: boolean                // Enable debug mode
  anonymizeIp?: boolean          // Anonymize IP addresses (recommended for EU)
  consentVersion?: string        // Current consent policy version
}

// =============================================================================
// Google Analytics Event Types (GA4)
// =============================================================================

/**
 * Standard GA4 event names
 */
export type GA4EventName =
  | 'page_view'
  | 'scroll'
  | 'click'
  | 'view_search_results'
  | 'file_download'
  // E-commerce events
  | 'view_item'
  | 'view_item_list'
  | 'select_item'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'purchase'
  | 'refund'
  // Engagement events
  | 'login'
  | 'sign_up'
  | 'share'
  | 'search'
  | 'select_content'
  // Custom events (string)
  | string

/**
 * Common event parameters
 */
export interface BaseEventParams {
  [key: string]: string | number | boolean | GA4Item[] | undefined
}

/**
 * E-commerce item for GA4
 */
export interface GA4Item {
  item_id: string
  item_name: string
  affiliation?: string
  coupon?: string
  discount?: number
  index?: number
  item_brand?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  item_category4?: string
  item_category5?: string
  item_list_id?: string
  item_list_name?: string
  item_variant?: string
  location_id?: string
  price?: number
  quantity?: number
}

/**
 * E-commerce event parameters
 */
export interface EcommerceEventParams extends BaseEventParams {
  currency?: string
  value?: number
  coupon?: string
  payment_type?: string
  shipping_tier?: string
  items?: GA4Item[]
  transaction_id?: string
  tax?: number
  shipping?: number
}

/**
 * Page view event parameters
 */
export interface PageViewParams extends BaseEventParams {
  page_title?: string
  page_location?: string
  page_path?: string
}

// =============================================================================
// Tracking Context Types
// =============================================================================

/**
 * Tracking context value provided by TrackingProvider
 */
export interface TrackingContextValue {
  // Consent state
  consent: ConsentState
  hasConsent: boolean | null  // null = not yet decided, true/false = decided
  
  // Consent actions
  acceptAll: () => void
  rejectAll: () => void
  updateConsent: (categories: Partial<Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>>) => void
  resetConsent: () => void
  
  // Tracking methods
  trackEvent: (eventName: GA4EventName, params?: BaseEventParams | EcommerceEventParams) => void
  trackPageView: (params?: PageViewParams) => void
  
  // State
  isInitialized: boolean
  isEnabled: boolean
}

// =============================================================================
// Global gtag type declaration
// =============================================================================

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

export {}
