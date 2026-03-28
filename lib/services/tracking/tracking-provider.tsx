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
  TrackingConfig,
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
} from './consent-manager'
import {
  initializeGA,
  updateGAConsent,
  trackEvent as gaTrackEvent,
  trackPageView as gaTrackPageView,
  isGAInitialized,
  resetGA,
} from './google-analytics'

// =============================================================================
// Context
// =============================================================================

const TrackingContext = createContext<TrackingContextValue | null>(null)

// =============================================================================
// Provider Props
// =============================================================================

interface TrackingProviderProps {
  children: ReactNode
  measurementId?: string
  adsId?: string
  debug?: boolean
  anonymizeIp?: boolean
  consentVersion?: string
}

// =============================================================================
// Provider Component
// =============================================================================

export function TrackingProvider({
  children,
  measurementId,
  adsId,
  debug = false,
  anonymizeIp = true,
  consentVersion = '1.0',
}: TrackingProviderProps) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT_STATE)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)
  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get measurement ID from props or env
  const gaId = measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
  const gaAdsId = adsId || process.env.NEXT_PUBLIC_GA_ADS_ID

  const config: TrackingConfig = useMemo(
    () => ({
      measurementId: gaId,
      adsId: gaAdsId,
      debug,
      anonymizeIp,
      consentVersion,
    }),
    [gaId, gaAdsId, debug, anonymizeIp, consentVersion]
  )

  // Load consent state on mount
  useEffect(() => {
    if (!mounted) return
    const storedConsent = getConsentState()
    setConsent(storedConsent)
    setHasConsent(hasConsentDecision() ? storedConsent.analytics || storedConsent.marketing : null)
  }, [mounted])

  // Check for Do Not Track browser setting
  const respectsDNT = typeof navigator !== 'undefined' && navigator.doNotTrack === '1'

  // Initialize GA immediately on mount with consent mode (respecting DNT)
  // Script loads with default consent "denied", then updates based on user consent
  useEffect(() => {
    if (!mounted) return
    if (!gaId) {
      if (debug) {
        console.log('[Tracking] No measurement ID configured')
      }
      return
    }

    // Honor Do Not Track browser setting
    if (respectsDNT) {
      if (debug) {
        console.log('[Tracking] Do Not Track enabled - skipping analytics')
      }
      return
    }

    // Always initialize GA - consent mode handles data collection
    if (!isGAInitialized()) {
      initializeGA(config, consent).then((success) => {
        setIsInitialized(success)
      })
    }
  }, [mounted, config, gaId, debug, respectsDNT, consent])

  // Track page views on route change
  useEffect(() => {
    if (!mounted) return
    if (isInitialized && consent.analytics) {
      gaTrackPageView()
    }
  }, [mounted, pathname, isInitialized, consent.analytics])

  // Consent actions
  const acceptAll = useCallback(() => {
    const newConsent = acceptAllConsent()
    setConsent(newConsent)
    setHasConsent(true)
    updateGAConsent(newConsent)

    // Track page view immediately after consent is granted
    if (isGAInitialized()) {
      gaTrackPageView()
    }
  }, [])

  const rejectAll = useCallback(() => {
    const newConsent = rejectAllConsent()
    setConsent(newConsent)
    setHasConsent(false)
    updateGAConsent(newConsent) // Consent mode will block data collection
  }, [])

  const updateConsent = useCallback(
    (
      categories: Partial<Omit<ConsentState, 'necessary' | 'timestamp' | 'version'>>
    ) => {
      const newConsent = updateConsentState(categories)
      setConsent(newConsent)
      setHasConsent(newConsent.analytics || newConsent.marketing)
      updateGAConsent(newConsent) // Consent mode handles data collection
    },
    []
  )

  const resetConsent = useCallback(() => {
    clearConsentState()
    setConsent(DEFAULT_CONSENT_STATE)
    setHasConsent(null)
    resetGA()
    setIsInitialized(false)
  }, [])

  // Tracking methods
  const trackEvent = useCallback(
    (eventName: GA4EventName, params?: BaseEventParams | EcommerceEventParams) => {
      if (isInitialized && consent.analytics) {
        gaTrackEvent(eventName, params)
      }
    },
    [isInitialized, consent.analytics]
  )

  const trackPageView = useCallback(
    (params?: PageViewParams) => {
      if (isInitialized && consent.analytics) {
        gaTrackPageView(params)
      }
    },
    [isInitialized, consent.analytics]
  )

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
