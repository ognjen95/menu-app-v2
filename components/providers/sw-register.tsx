'use client'

import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react'

const SW_PATH = '/sw.js'

// Offline context for app-wide offline state
interface OfflineContextValue {
  isOffline: boolean
  isServiceWorkerReady: boolean
}

const OfflineContext = createContext<OfflineContextValue>({
  isOffline: false,
  isServiceWorkerReady: false,
})

export const useOfflineStatus = () => useContext(OfflineContext)

export function SwRegister({ children }: { children?: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false)
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    setIsOffline(false)
    // Store online state for service worker
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-online-status', 'online')
    }
  }, [])

  const handleOffline = useCallback(() => {
    setIsOffline(true)
    // Store offline state for service worker
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-online-status', 'offline')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Set initial online status
    setIsOffline(!navigator.onLine)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pwa-online-status', navigator.onLine ? 'online' : 'offline')
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  // Service worker registration
  useEffect(() => {
    // Allow registration in production and Vercel preview deployments
    const isProduction = process.env.NODE_ENV === 'production'
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    
    if (!isProduction && !isVercel) {
      console.log('[PWA] Service worker disabled in local development')
      return
    }
    
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported')
      return
    }

    let mounted = true

    const register = async () => {
      try {
        console.log('[PWA] Attempting to register service worker at', SW_PATH)
        const scope = '/'
        const existing = await navigator.serviceWorker.getRegistration(scope)
        if (existing) {
          console.log('[PWA] Existing service worker found, updating...')
          await existing.update()
          setIsServiceWorkerReady(true)
          return
        }
        console.log('[PWA] Registering new service worker...')
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope })
        if (mounted) {
          console.log('[PWA] Service worker registered successfully')
          setIsServiceWorkerReady(true)
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[PWA] New service worker activated')
                }
              })
            }
          })
        }
      } catch (error) {
        if (mounted) {
          console.error('[PWA] Failed to register service worker:', error)
          // Check if sw.js exists
          fetch(SW_PATH).then(res => {
            if (!res.ok) {
              console.error('[PWA] Service worker file not found at', SW_PATH)
            }
          }).catch(() => {
            console.error('[PWA] Could not fetch service worker file')
          })
        }
      }
    }

    register()

    return () => {
      mounted = false
    }
  }, [])

  const contextValue = useMemo(() => ({
    isOffline,
    isServiceWorkerReady,
  }), [isOffline, isServiceWorkerReady])

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  )
}
