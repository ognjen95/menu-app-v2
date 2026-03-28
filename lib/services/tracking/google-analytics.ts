import {
  TrackingConfig,
  ConsentState,
  GA4EventName,
  BaseEventParams,
  EcommerceEventParams,
  PageViewParams,
} from './types'
import { getGoogleConsentMode, isBrowser } from './consent-manager'

// =============================================================================
// Google Analytics Service
// =============================================================================

let isInitialized = false
let currentConfig: TrackingConfig | null = null

/**
 * Initialize the dataLayer and gtag function
 */
function initializeDataLayer(): void {
  if (!isBrowser()) return

  window.dataLayer = window.dataLayer || []
  
  // Define gtag function if not exists
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
  }
}

/**
 * Load the Google Analytics script
 */
function loadGAScript(measurementId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error('Not in browser environment'))
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`
    )
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load GA script'))
    
    document.head.appendChild(script)
  })
}

/**
 * Initialize Google Analytics with consent mode
 */
export async function initializeGA(
  config: TrackingConfig,
  consent: ConsentState
): Promise<boolean> {
  if (!isBrowser()) {
    return false
  }

  // Don't initialize if analytics consent not given
  if (!consent.analytics) {
    if (config.debug) {
      console.log('[GA4] Skipping initialization - analytics consent not given')
    }
    return false
  }

  try {
    // Initialize dataLayer first
    initializeDataLayer()

    // Set default consent state before loading script
    const consentMode = getGoogleConsentMode(consent)
    window.gtag('consent', 'default', consentMode)

    // Load the GA script
    await loadGAScript(config.measurementId)

    // Initialize GA
    window.gtag('js', new Date())
    
    // Configure with options
    const configOptions: Record<string, unknown> = {
      send_page_view: false, // We'll send manually for more control
    }

    if (config.anonymizeIp) {
      configOptions.anonymize_ip = true
    }

    if (config.debug) {
      configOptions.debug_mode = true
    }

    window.gtag('config', config.measurementId, configOptions)

    isInitialized = true
    currentConfig = config

    if (config.debug) {
      console.log('[GA4] Initialized successfully with:', config.measurementId)
    }

    return true
  } catch (error) {
    console.error('[GA4] Failed to initialize:', error)
    return false
  }
}

/**
 * Update consent mode after user interaction
 */
export function updateGAConsent(consent: ConsentState): void {
  if (!isBrowser() || typeof window.gtag !== 'function') {
    return
  }

  const consentMode = getGoogleConsentMode(consent)
  window.gtag('consent', 'update', consentMode)

  if (currentConfig?.debug) {
    console.log('[GA4] Consent updated:', consentMode)
  }
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: GA4EventName,
  params?: BaseEventParams | EcommerceEventParams
): void {
  if (!isBrowser() || !isInitialized) {
    return
  }

  window.gtag('event', eventName, params)

  if (currentConfig?.debug) {
    console.log('[GA4] Event tracked:', eventName, params)
  }
}

/**
 * Track a page view
 */
export function trackPageView(params?: PageViewParams): void {
  if (!isBrowser() || !isInitialized || !currentConfig) {
    return
  }

  const pageViewParams: PageViewParams = {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...params,
  }

  window.gtag('event', 'page_view', {
    ...pageViewParams,
    send_to: currentConfig.measurementId,
  })

  if (currentConfig?.debug) {
    console.log('[GA4] Page view tracked:', pageViewParams)
  }
}

/**
 * Set user ID for cross-device tracking
 */
export function setUserId(userId: string | null): void {
  if (!isBrowser() || !isInitialized || !currentConfig) {
    return
  }

  window.gtag('config', currentConfig.measurementId, {
    user_id: userId,
  })

  if (currentConfig?.debug) {
    console.log('[GA4] User ID set:', userId)
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, string | number | boolean>): void {
  if (!isBrowser() || !isInitialized) {
    return
  }

  window.gtag('set', 'user_properties', properties)

  if (currentConfig?.debug) {
    console.log('[GA4] User properties set:', properties)
  }
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
 * // Simple usage - auto-prepends NEXT_PUBLIC_GA_MEASUREMENT_ID
 * trackConversion('RXGkCLDNlJEcEMjEhpFD')
 * 
 * // With additional params
 * trackConversion('RXGkCLDNlJEcEMjEhpFD', { params: { value: 100, currency: 'USD' } })
 * 
 * // Raw mode for different account
 * trackConversion('AW-OTHER-ACCOUNT/XYZ123', { raw: true })
 */
export function trackConversion(conversionId: string, options?: ConversionOptions): void {
  if (!isBrowser()) {
    return
  }

  // Conversions can fire even without full GA init, as long as gtag is loaded
  if (typeof window.gtag !== 'function') {
    if (currentConfig?.debug) {
      console.log('[GA4] gtag not available for conversion tracking')
    }
    return
  }

  // Build the send_to value
  let sendTo: string
  if (options?.raw) {
    sendTo = conversionId
  } else {
    const measurementId = currentConfig?.measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    if (!measurementId) {
      console.warn('[GA4] No measurement ID available for conversion tracking')
      return
    }
    sendTo = `${measurementId}/${conversionId}`
  }

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    ...options?.params,
  })

  if (currentConfig?.debug) {
    console.log('[GA4] Conversion tracked:', sendTo, options?.params)
  }
}

/**
 * Check if GA is initialized
 */
export function isGAInitialized(): boolean {
  return isInitialized
}

/**
 * Reset GA state (for testing or consent withdrawal)
 */
export function resetGA(): void {
  isInitialized = false
  currentConfig = null
}
