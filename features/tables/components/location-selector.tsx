'use client'

import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Location } from '@/lib/types'

interface LocationSelectorProps {
  locations: Location[]
  selectedId: string | null
  onSelect: (id: string) => void
  emptyMessage: string
  createLink: string
  createLinkLabel: string
}

export function LocationSelector({
  locations,
  selectedId,
  onSelect,
  emptyMessage,
  createLink,
  createLinkLabel,
}: LocationSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {locations.map((location) => (
        <Button
          key={location.id}
          variant={selectedId === location.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(location.id)}
          className="gap-1.5 h-9 px-3 text-sm md:gap-2"
        >
          <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
          {location.name}
        </Button>
      ))}
      {locations.length === 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          {emptyMessage}
          <Link href={createLink} className="text-primary underline">
            {createLinkLabel}
          </Link>
        </div>
      )}
    </div>
  )
}
