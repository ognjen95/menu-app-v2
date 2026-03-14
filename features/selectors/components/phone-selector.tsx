'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { EUROPE_COUNTRIES } from '@/lib/constants/countries'

interface PhoneSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  filterByActive?: boolean
}

export function PhoneSelector({
  value = '',
  onValueChange,
  placeholder = '64 123 4567',
  disabled = false,
  filterByActive = true
}: PhoneSelectorProps) {
  const activeCountries = filterByActive ? EUROPE_COUNTRIES.filter(c => c.isActive) : EUROPE_COUNTRIES

  // Parse the current value to extract dialing code and phone number
  const { dialingCode, phoneNumber } = useMemo(() => {
    if (!value) return { dialingCode: '', phoneNumber: '' }
    
    // Find matching dialing code from the value
    const matchedCountry = activeCountries.find(c => value.startsWith(c.dialingCode))
    if (matchedCountry) {
      const code = matchedCountry.dialingCode
      const number = value.substring(code.length).trim()
      return { dialingCode: code, phoneNumber: number }
    }
    
    // If no match, try to split by space
    const parts = value.trim().split(' ')
    if (parts.length > 1 && parts[0].startsWith('+')) {
      return { dialingCode: parts[0], phoneNumber: parts.slice(1).join(' ') }
    }
    
    return { dialingCode: '', phoneNumber: value }
  }, [value, activeCountries])

  const handleDialingCodeChange = (code: string) => {
    const combined = `${code} ${phoneNumber}`.trim()
    onValueChange?.(combined)
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value
    const combined = dialingCode ? `${dialingCode} ${number}` : number
    onValueChange?.(combined)
  }

  // Get the selected country for display in trigger
  const selectedCountry = activeCountries.find(c => c.dialingCode === dialingCode)

  return (
    <div className="flex gap-2">
      <Select value={dialingCode} onValueChange={handleDialingCodeChange} disabled={disabled}>
        <SelectTrigger className="w-[120px]">
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span className="font-mono">{selectedCountry.dialingCode}</span>
            </div>
          ) : (
            <SelectValue placeholder="Code" />
          )}
        </SelectTrigger>
        <SelectContent>
          {activeCountries.map((country) => (
            <SelectItem key={country.code} value={country.dialingCode}>
              <div className="flex items-center gap-2">
                <span>{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{country.dialingCode}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  )
}
