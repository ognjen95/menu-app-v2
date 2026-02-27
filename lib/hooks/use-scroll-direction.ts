"use client"

import { useState, useEffect, useRef } from 'react'

export type ScrollDirection = 'up' | 'down' | null

interface UseScrollDirectionOptions {
  threshold?: number
  initialDirection?: ScrollDirection
  enabled?: boolean
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = null, enabled = true } = options
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection)
  
  // Use refs to avoid re-renders and useCallback recreation
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    // Don't attach listeners if disabled
    if (!enabled) {
      setScrollDirection(null)
      return
    }

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const diff = scrollY - lastScrollY.current

      if (Math.abs(diff) >= threshold) {
        const newDirection = diff > 0 ? 'down' : 'up'
        setScrollDirection(prev => prev !== newDirection ? newDirection : prev)
        lastScrollY.current = scrollY > 0 ? scrollY : 0
      }
      
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        window.requestAnimationFrame(updateScrollDirection)
      }
    }

    // Set initial scroll position
    lastScrollY.current = window.scrollY

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [threshold, enabled])

  return {
    scrollDirection,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
  }
}
