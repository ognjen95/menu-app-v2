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
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let mounted = true

    const register = async () => {
      try {
        const scope = '/'
        const existing = await navigator.serviceWorker.getRegistration(scope)
        if (existing) {
          await existing.update()
          setIsServiceWorkerReady(true)
          return
        }
        const registration = await navigator.serviceWorker.register(SW_PATH)
        if (mounted) {
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
          console.error('[PWA] Failed to register service worker', error)
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
