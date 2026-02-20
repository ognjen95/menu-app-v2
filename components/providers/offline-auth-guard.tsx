'use client'

import { useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useOfflineStatus } from './sw-register'
import { User } from '@supabase/supabase-js'
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react'

interface OfflineAuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Client-side auth guard that handles offline scenarios
 * - Uses Supabase browser client which reads from localStorage
 * - Shows offline indicator when network is unavailable
 * - Allows access to cached content when offline if user was previously authenticated
 */
export function OfflineAuthGuard({ children, fallback }: OfflineAuthGuardProps) {
  const { isOffline, isServiceWorkerReady } = useOfflineStatus()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Check current session (reads from localStorage when offline)
    const checkSession = async () => {
      try {
        // getSession reads from localStorage, works offline
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // If offline and there's an error, try to use cached session
          if (isOffline) {
            const cachedUser = localStorage.getItem('sb-auth-user')
            if (cachedUser) {
              try {
                setUser(JSON.parse(cachedUser))
                setAuthError(null)
              } catch {
                setAuthError('Session expired. Please reconnect to login.')
              }
            } else {
              setAuthError('No cached session. Please connect to login.')
            }
          } else {
            setAuthError(error.message)
          }
        } else if (session?.user) {
          setUser(session.user)
          setAuthError(null)
          // Cache user for offline access
          localStorage.setItem('sb-auth-user', JSON.stringify(session.user))
        } else if (isOffline) {
          // Offline with no session - check cached user
          const cachedUser = localStorage.getItem('sb-auth-user')
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
              setAuthError(null)
            } catch {
              setAuthError('Session expired. Please reconnect to login.')
            }
          } else {
            setAuthError('You need to be online to log in.')
          }
        } else {
          setUser(null)
          setAuthError('Please log in to continue.')
        }
      } catch (error) {
        console.error('[OfflineAuthGuard] Session check failed:', error)
        if (isOffline) {
          // Try cached user as fallback
          const cachedUser = localStorage.getItem('sb-auth-user')
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser))
              setAuthError(null)
            } catch {
              setAuthError('Session expired. Please reconnect to login.')
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          localStorage.removeItem('sb-auth-user')
        } else if (session?.user) {
          setUser(session.user)
          localStorage.setItem('sb-auth-user', JSON.stringify(session.user))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [isOffline])

  // Show loading state
  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Show error state when not authenticated
  if (authError && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <WifiOff className="h-6 w-6" />
          <span className="text-lg font-medium">
            {isOffline ? 'You are offline' : 'Authentication required'}
          </span>
        </div>
        <p className="text-muted-foreground text-center max-w-md">
          {authError}
        </p>
        {isOffline && (
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry when online
          </button>
        )}
      </div>
    )
  }

  // User is authenticated (or has valid cached session when offline)
  return <>{children}</>
}

/**
 * Offline indicator banner - shows when user is offline
 */
export function OfflineIndicator() {
  const { isOffline } = useOfflineStatus()
  
  // Suppress WebSocket errors when offline
  useEffect(() => {
    if (!isOffline) return

    const originalError = console.error
    console.error = (...args: any[]) => {
      // Suppress WebSocket and Supabase realtime errors when offline
      const message = args[0]?.toString() || ''
      if (
        message.includes('WebSocket') ||
        message.includes('realtime') ||
        message.includes('supabase.co/realtime')
      ) {
        return // Suppress these errors when offline
      }
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [isOffline])
  
  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-1 px-4 text-center text-sm font-medium">
      <WifiOff className="inline-block h-4 w-4 mr-2" />
      You are offline. Viewing cached data.
    </div>
  )
}
