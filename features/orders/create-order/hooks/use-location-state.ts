'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/lib/types'

const LOCATION_STORAGE_KEY = 'pos-selected-location'

type UseLocationStateProps = {
  locations: Location[]
  initialLocationId?: string
}

export function useLocationState({ locations, initialLocationId }: UseLocationStateProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')

  // Initialize from prop, then localStorage, then first location
  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocationId(initialLocationId)
      return
    }

    const saved = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (saved && locations.some(l => l.id === saved)) {
      setSelectedLocationId(saved)
      return
    }

    if (locations.length > 0) {
      setSelectedLocationId(locations[0].id)
    }
  }, [initialLocationId, locations])

  // Save to localStorage when changed
  useEffect(() => {
    if (selectedLocationId) {
      localStorage.setItem(LOCATION_STORAGE_KEY, selectedLocationId)
    }
  }, [selectedLocationId])

  const handleLocationChange = useCallback((locationId: string) => {
    setSelectedLocationId(locationId)
  }, [])

  const selectedLocation = locations.find(l => l.id === selectedLocationId)

  return {
    locations,
    selectedLocationId,
    selectedLocation,
    setSelectedLocationId: handleLocationChange,
  }
}
