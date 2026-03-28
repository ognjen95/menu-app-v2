import { isBrowser } from './consent-manager'

// =============================================================================
// Google Analytics Utilities
// =============================================================================
// Note: GA4 script is loaded via Script tags in app/layout.tsx with consent mode.
// This file provides utilities for conversion tracking and advanced features.

/**
 * Set user ID for cross-device tracking
 */
export function setUserId(userId: string | null): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return
  
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!measurementId) return

  window.gtag('config', measurementId, { user_id: userId })
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, string | number | boolean>): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return
  window.gtag('set', 'user_properties', properties)
}

interface ConversionOptions {
  /** Additional event parameters */
  params?: Record<string, unknown>
  /** If true, conversionId is used as-is without prepending measurement ID */
  raw?: boolean
}

/**
 * Track a Google Ads conversion event
 * Use this for conversion tracking from Google Ads campaigns
 * 
 * @param conversionId - The conversion label (e.g., 'RXGkCLDNlJEcEMjEhpFD') or full send_to if raw=true
 * @param options - Optional params and raw flag
 * 
 * @example
 * // Simple usage - auto-prepends NEXT_PUBLIC_GA_ADS_ID (e.g., AW-17987905992)
 * trackConversion('RXGkCLDNlJEcEMjEhpFD')
 * 
 * // With additional params
 * trackConversion('RXGkCLDNlJEcEMjEhpFD', { params: { value: 100, currency: 'USD' } })
 * 
 * // Raw mode for different account
 * trackConversion('AW-OTHER-ACCOUNT/XYZ123', { raw: true })
 */
export function trackConversion(conversionId: string, options?: ConversionOptions): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return

  // Build the send_to value - use Google Ads ID for conversions
  let sendTo: string
  if (options?.raw) {
    sendTo = conversionId
  } else {
    const adsId = process.env.NEXT_PUBLIC_GA_ADS_ID
    if (!adsId) {
      console.warn('[GA4] No Google Ads ID available for conversion tracking')
      return
    }
    sendTo = `${adsId}/${conversionId}`
  }

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    ...options?.params,
  })
}
