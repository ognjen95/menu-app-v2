import { ConsentState, DEFAULT_CONSENT_STATE, ConsentCategory } from './types'

// =============================================================================
// Constants
// =============================================================================

const CONSENT_STORAGE_KEY = 'klopay_cookie_consent'
const CURRENT_CONSENT_VERSION = '1.0'

// =============================================================================
// Consent Manager
// =============================================================================

/**
 * Check if we're in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * Get the current consent state from localStorage
 */
export function getConsentState(): ConsentState {
  if (!isBrowser()) {
    return DEFAULT_CONSENT_STATE
  }

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!stored) {
      return DEFAULT_CONSENT_STATE
    }

    const parsed = JSON.parse(stored) as ConsentState
    
    // Check if consent version has changed - if so, we need to re-prompt
    if (parsed.version !== CURRENT_CONSENT_VERSION) {
      return DEFAULT_CONSENT_STATE
    }

    // Ensure necessary is always true
    return {
      ...parsed,
      necessary: true,
    }
  } catch {
    return DEFAULT_CONSENT_STATE
  }
}

/**
 * Save consent state to localStorage
 */
export function saveConsentState(consent: ConsentState): void {
  if (!isBrowser()) {
    return
  }

  try {
    const stateToSave: ConsentState = {
      ...consent,
      necessary: true, // Always true
      timestamp: Date.now(),
      version: CURRENT_CONSENT_VERSION,
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    console.error('[Tracking] Failed to save consent state:', error)
  }
}

/**
 * Clear consent state from localStorage (reset)
 */
export function clearConsentState(): void {
  if (!isBrowser()) {
    return
  }

  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch (error) {
    console.error('[Tracking] Failed to clear consent state:', error)
  }
}

/**
 * Check if user has made a consent decision
 */
export function hasConsentDecision(): boolean {
  if (!isBrowser()) {
    return false
  }

  const state = getConsentState()
  return state.timestamp > 0
}

/**
 * Check if a specific consent category is allowed
 */
export function hasConsentFor(category: ConsentCategory): boolean {
  const state = getConsentState()
  return state[category] === true
}

/**
 * Accept all consent categories
 */
export function acceptAllConsent(): ConsentState {
  const newState: ConsentState = {
    necessary: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
    version: CURRENT_CONSENT_VERSION,
  }
  saveConsentState(newState)
  return newState
}

/**
 * Reject all optional consent categories (keep necessary)
 */
export function rejectAllConsent(): ConsentState {
  const newState: ConsentState = {
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
    version: CURRENT_CONSENT_VERSION,
  }
  saveConsentState(newState)
  return newState
}

/**
 * Update specific consent categories
 */
export function updateConsent(
  updates: Partial<Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>>
): ConsentState {
  const current = getConsentState()
  const newState: ConsentState = {
    ...current,
    ...updates,
    necessary: true, // Always true
    timestamp: Date.now(),
    version: CURRENT_CONSENT_VERSION,
  }
  saveConsentState(newState)
  return newState
}

/**
 * Get consent state for Google's consent mode
 * Maps our consent to Google's consent mode v2 format
 */
export function getGoogleConsentMode(consent: ConsentState): Record<string, 'granted' | 'denied'> {
  return {
    ad_storage: consent.marketing ? 'granted' : 'denied',
    ad_user_data: consent.marketing ? 'granted' : 'denied',
    ad_personalization: consent.marketing ? 'granted' : 'denied',
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    functionality_storage: consent.necessary ? 'granted' : 'denied',
    personalization_storage: consent.analytics ? 'granted' : 'denied',
    security_storage: 'granted', // Always granted for security
  }
}
