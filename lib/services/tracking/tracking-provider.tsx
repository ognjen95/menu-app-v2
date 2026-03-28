'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import {
  TrackingContextValue,
  ConsentState,
  DEFAULT_CONSENT_STATE,
  GA4EventName,
  BaseEventParams,
  EcommerceEventParams,
  PageViewParams,
} from './types'
import {
  getConsentState,
  hasConsentDecision,
  acceptAllConsent,
  rejectAllConsent,
  updateConsent as updateConsentState,
  clearConsentState,
  getGoogleConsentMode,
} from './consent-manager'
import { isBrowser } from './consent-manager'

// =============================================================================
// Context
// =============================================================================

const TrackingContext = createContext<TrackingContextValue | null>(null)

// =============================================================================
// Helper: Update gtag consent
// =============================================================================

function updateGtagConsent(consent: ConsentState): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return
  
  const consentMode = getGoogleConsentMode(consent)
  window.gtag('consent', 'update', consentMode)
}

// =============================================================================
// Helper: Track page view via gtag
// =============================================================================

function trackGtagPageView(params?: PageViewParams): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return
  
  const pageViewParams = {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
    ...params,
  }
  
  window.gtag('event', 'page_view', pageViewParams)
}

// =============================================================================
// Helper: Track event via gtag
// =============================================================================

function trackGtagEvent(
  eventName: GA4EventName,
  params?: BaseEventParams | EcommerceEventParams
): void {
  if (!isBrowser() || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

// =============================================================================
// Provider Props
// =============================================================================

interface TrackingProviderProps {
  children: ReactNode
  debug?: boolean
}

// =============================================================================
// Provider Component
// =============================================================================

export function TrackingProvider({
  children,
  debug = false,
}: TrackingProviderProps) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT_STATE)
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load consent state on mount and update gtag consent if already granted
  useEffect(() => {
    if (!mounted) return
    const storedConsent = getConsentState()
    setConsent(storedConsent)
    setHasConsent(hasConsentDecision() ? storedConsent.analytics || storedConsent.marketing : null)
    
    // If consent was previously granted, update gtag
    if (storedConsent.analytics || storedConsent.marketing) {
      updateGtagConsent(storedConsent)
    }
  }, [mounted])

  // Track page views on route change (only if consent granted)
  useEffect(() => {
    if (!mounted) return
    if (consent.analytics) {
      trackGtagPageView()
      if (debug) {
        console.log('[Tracking] Page view tracked:', pathname)
      }
    }
  }, [mounted, pathname, consent.analytics, debug])

  // Consent actions
  const acceptAll = useCallback(() => {
    const newConsent = acceptAllConsent()
    setConsent(newConsent)
    setHasConsent(true)
    updateGtagConsent(newConsent)
    
    // Track page view immediately after consent
    trackGtagPageView()
    
    if (debug) {
      console.log('[Tracking] Consent accepted, page view tracked')
    }
  }, [debug])

  const rejectAll = useCallback(() => {
    const newConsent = rejectAllConsent()
    setConsent(newConsent)
    setHasConsent(false)
    updateGtagConsent(newConsent)
    
    if (debug) {
      console.log('[Tracking] Consent rejected')
    }
  }, [debug])

  const updateConsent = useCallback(
    (categories: Partial<Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>>) => {
      const newConsent = updateConsentState(categories)
      setConsent(newConsent)
      setHasConsent(newConsent.analytics || newConsent.marketing)
      updateGtagConsent(newConsent)
    },
    []
  )

  const resetConsent = useCallback(() => {
    clearConsentState()
    setConsent(DEFAULT_CONSENT_STATE)
    setHasConsent(null)
    updateGtagConsent(DEFAULT_CONSENT_STATE)
  }, [])

  // Tracking methods (only fire if consent granted)
  const trackEvent = useCallback(
    (eventName: GA4EventName, params?: BaseEventParams | EcommerceEventParams) => {
      if (consent.analytics) {
        trackGtagEvent(eventName, params)
      }
    },
    [consent.analytics]
  )

  const trackPageView = useCallback(
    (params?: PageViewParams) => {
      if (consent.analytics) {
        trackGtagPageView(params)
      }
    },
    [consent.analytics]
  )

  // GA is always initialized via Script tags in layout.tsx
  const isInitialized = mounted && typeof window !== 'undefined' && typeof window.gtag === 'function'

  const value: TrackingContextValue = useMemo(
    () => ({
      consent,
      hasConsent,
      acceptAll,
      rejectAll,
      updateConsent,
      resetConsent,
      trackEvent,
      trackPageView,
      isInitialized,
      isEnabled: consent.analytics,
    }),
    [
      consent,
      hasConsent,
      acceptAll,
      rejectAll,
      updateConsent,
      resetConsent,
      trackEvent,
      trackPageView,
      isInitialized,
    ]
  )

  return (
    <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext)
  
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider')
  }
  
  return context
}

// =============================================================================
// Optional hook that doesn't throw (for use outside provider)
// =============================================================================

export function useTrackingOptional(): TrackingContextValue | null {
  return useContext(TrackingContext)
}
