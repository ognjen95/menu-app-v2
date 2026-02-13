'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to detect online/offline status
 * Returns current online status and methods to check connectivity
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  // Check actual connectivity by pinging the server
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    // Set initial state based on navigator
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }
    
    const handleOnline = () => {
      setIsOnline(true)
      // If we were offline, mark it so we can show "back online" message
      if (!isOnline) {
        setWasOffline(true)
        // Clear the wasOffline flag after a short delay
        setTimeout(() => setWasOffline(false), 5000)
      }
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isOnline])

  return { 
    isOnline, 
    wasOffline,
    checkConnectivity,
  }
}
