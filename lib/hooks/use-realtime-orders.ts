'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useOfflineStatus } from '@/components/providers/sw-register'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseRealtimeOrdersReturn {
  status: ConnectionStatus
  isLive: boolean
  newOrders: any[]
  clearNewOrders: () => void
  reconnect: () => void
}

// Custom event for cross-component communication
const NEW_ORDER_EVENT = 'realtime:new-order'

// Singleton supabase client to avoid recreation
let supabaseInstance: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

export function useRealtimeOrders(
  enabled: boolean = false,
  locationId?: string
): UseRealtimeOrdersReturn {
  const queryClient = useQueryClient()
  const { isOffline } = useOfflineStatus()
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [newOrders, setNewOrders] = useState<any[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const enabledRef = useRef(enabled)
  const locationIdRef = useRef(locationId)
  
  // Keep refs in sync
  enabledRef.current = enabled
  locationIdRef.current = locationId

  const clearNewOrders = useCallback(() => {
    setNewOrders([])
  }, [])

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const supabase = getSupabase()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    
    if (!enabledRef.current) {
      setStatus('disconnected')
      return
    }

    // Don't try to connect if offline
    if (isOffline) {
      setStatus('disconnected')
      return
    }

    // Cleanup any existing connection first
    cleanup()
    setStatus('connecting')

    const supabase = getSupabase()
    const channelName = `orders-live-${Date.now()}`
    

    const channel = supabase.channel(channelName)
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        const newOrder = payload.new as { status?: string; [key: string]: unknown }
        
        // Only trigger modal/sound for orders with status 'placed'
        // Orders created with other statuses (e.g. 'accepted' from create-order dialog) are ignored
        if (newOrder.status === 'placed') {
          // Add to new orders array
          setNewOrders(prev => {
            const updated = [newOrder, ...prev]
            return updated
          })
          
          // Dispatch custom event for other listeners (sound notification)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(NEW_ORDER_EVENT, { 
              detail: newOrder 
            }))
          }
        }
        
        // Always invalidate queries to refresh the list (for all new orders)
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['orders', 'active'] })
      }
    )
    
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['orders', 'active'] })
      }
    )
    
    channel.subscribe((status, err) => {
      
      if (status === 'SUBSCRIBED') {
        setStatus('connected')
      } else if (status === 'CHANNEL_ERROR') {
        setStatus('error')
      } else if (status === 'TIMED_OUT') {
        setStatus('error')
      } else if (status === 'CLOSED') {
        setStatus('disconnected')
      }
    })

    channelRef.current = channel
  }, [cleanup, queryClient, isOffline])

  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  // Main effect - connect/disconnect based on enabled state
  useEffect(() => {
    
    if (enabled) {
      // Small delay to ensure component is mounted
      const timeoutId = setTimeout(() => {
        connect()
      }, 100)
      return () => {
        clearTimeout(timeoutId)
        cleanup()
      }
    } else {
      cleanup()
      setStatus('disconnected')
    }
  }, [enabled]) // Only depend on enabled

  // Auto-reconnect on error with exponential backoff
  const reconnectAttemptRef = useRef(0)
  const maxReconnectAttempts = 5
  
  useEffect(() => {
    // Don't try to reconnect if offline
    if (isOffline) {
      return
    }

    if (status === 'error' && enabledRef.current) {
      const attempt = reconnectAttemptRef.current
      if (attempt < maxReconnectAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempt), 16000)
        console.log(`[Realtime] Auto-reconnecting in ${delay}ms (attempt ${attempt + 1}/${maxReconnectAttempts})`)
        
        const timeoutId = setTimeout(() => {
          reconnectAttemptRef.current = attempt + 1
          connect()
        }, delay)
        
        return () => clearTimeout(timeoutId)
      } else {
        console.log('[Realtime] Max reconnect attempts reached')
      }
    } else if (status === 'connected') {
      // Reset attempt counter on successful connection
      reconnectAttemptRef.current = 0
    }
  }, [status, connect, isOffline])

  // Periodic health check - verify connection every 30 seconds
  useEffect(() => {
    if (!enabled || isOffline) return
    
    const healthCheckInterval = setInterval(() => {
      // Skip health check if offline
      if (isOffline) return

      const channel = channelRef.current
      if (channel) {
        // Check if channel is still subscribed
        const state = channel.state
        if (state !== 'joined' && state !== 'joining') {
          console.log(`[Realtime] Health check failed - channel state: ${state}, reconnecting...`)
          reconnectAttemptRef.current = 0 // Reset attempts for health check reconnect
          connect()
        }
      } else if (enabledRef.current && status !== 'connecting') {
        // No channel but should be connected
        console.log('[Realtime] Health check - no channel found, reconnecting...')
        reconnectAttemptRef.current = 0
        connect()
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(healthCheckInterval)
  }, [enabled, connect, status, isOffline])

  // Handle offline/online transitions
  useEffect(() => {
    if (isOffline) {
      // Going offline - disconnect and cleanup
      if (channelRef.current) {
        console.log('[Realtime] Going offline - disconnecting')
        cleanup()
        setStatus('disconnected')
      }
    } else if (enabled && status === 'disconnected') {
      // Coming back online - reconnect if enabled
      console.log('[Realtime] Back online - reconnecting')
      reconnectAttemptRef.current = 0 // Reset attempts
      connect()
    }
  }, [isOffline, enabled, status, cleanup, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    status,
    isLive: status === 'connected',
    newOrders,
    clearNewOrders,
    reconnect,
  }
}

// Helper hook to listen for new order events
export function useNewOrderListener(callback: (order: any) => void) {
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      callback(event.detail)
    }
    
    window.addEventListener(NEW_ORDER_EVENT, handler as EventListener)
    return () => {
      window.removeEventListener(NEW_ORDER_EVENT, handler as EventListener)
    }
  }, [callback])
}
