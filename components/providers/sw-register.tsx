'use client'

import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react'
import { syncManager } from '@/lib/offline'

// Offline context for app-wide offline state
interface OfflineContextValue {
  isOffline: boolean
  isServiceWorkerReady: boolean
  triggerSync: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue>({
  isOffline: false,
  isServiceWorkerReady: false,
  triggerSync: async () => {},
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

  // Service worker status monitoring
  // Note: @ducanh2912/next-pwa handles registration automatically with register: true
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Check if service worker is already controlling the page
    const checkSWStatus = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/')
        if (registration?.active) {
          console.log('[PWA] Service worker is active')
          setIsServiceWorkerReady(true)
        }
        
        // Listen for new service worker activations
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] New service worker activated')
          setIsServiceWorkerReady(true)
        })
      } catch (error) {
        console.warn('[PWA] Could not check service worker status:', error)
      }
    }

    checkSWStatus()
  }, [])

  // Trigger sync manually
  const triggerSync = useCallback(async () => {
    if (!isOffline && navigator.onLine) {
      await syncManager.startSync()
    }
  }, [isOffline])

  // Initialize sync manager
  useEffect(() => {
    const cleanup = syncManager.init()
    return cleanup
  }, [])

  const contextValue = useMemo(() => ({
    isOffline,
    isServiceWorkerReady,
    triggerSync,
  }), [isOffline, isServiceWorkerReady, triggerSync])

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  )
}
