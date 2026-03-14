'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EUROPE_COUNTRIES } from '@/lib/constants/countries'

interface CurrencySelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  filterByActive?: boolean
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder = 'Select currency',
  disabled = false,
  filterByActive = true,
}: CurrencySelectorProps) {
  // Get unique currencies from active countries
  const countries = filterByActive ? EUROPE_COUNTRIES.filter(c => c.isActive) : EUROPE_COUNTRIES
  const currencies = Array.from(
    new Map(
      countries.map(c => [
        c.currency,
        { code: c.currency, country: c.name, flag: c.flag }
      ])
    ).values()
  )

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.code}</span>
              <span className="text-xs text-muted-foreground">({currency.country})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
