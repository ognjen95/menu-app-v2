'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EUROPE_COUNTRIES } from '@/lib/constants/countries'

interface CountrySelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  filterByActive?: boolean
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder = 'Select country',
  disabled = false,
  filterByActive = true,
}: CountrySelectorProps) {
  const activeCountries = filterByActive ? EUROPE_COUNTRIES.filter(c => c.isActive) : EUROPE_COUNTRIES

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {activeCountries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
