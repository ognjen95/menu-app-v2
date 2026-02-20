'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Timeframe = 'day' | 'month' | 'year'

interface Location {
  id: string
  name: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface OverviewHeaderProps {
  timeframe: Timeframe
  selectedYear: number
  selectedMonth: number
  selectedDay: number
  selectedLocation: string
  locations: Location[]
  years: number[]
  daysInMonth: number[]
  formattedDate: string
  canGoForward: boolean
  today: Date
  onTimeframeChange: (timeframe: Timeframe) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onDayChange: (day: number) => void
  onLocationChange: (location: string) => void
  onNavigateBack: () => void
  onNavigateForward: () => void
}

export function OverviewHeader({
  timeframe,
  selectedYear,
  selectedMonth,
  selectedDay,
  selectedLocation,
  locations,
  years,
  daysInMonth,
  formattedDate,
  canGoForward,
  today,
  onTimeframeChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  onLocationChange,
  onNavigateBack,
  onNavigateForward,
}: OverviewHeaderProps) {
  const t = useTranslations('dashboard')

  const timeframeOptions: { value: Timeframe; label: string }[] = [
    { value: 'day', label: t('timeframe.day') },
    { value: 'month', label: t('timeframe.month') },
    { value: 'year', label: t('timeframe.year') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('overview.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          {timeframeOptions.map((option) => (
            <Button
              key={option.value}
              variant={timeframe === option.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTimeframeChange(option.value)}
              className="px-4"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />

        {/* Year Selector - Always visible */}
        <Select value={selectedYear.toString()} onValueChange={(v) => onYearChange(parseInt(v))}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Month Selector - For day and month timeframe */}
        {(timeframe === 'day' || timeframe === 'month') && (
          <Select value={selectedMonth.toString()} onValueChange={(v) => onMonthChange(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem
                  key={month}
                  value={index.toString()}
                  disabled={selectedYear === today.getFullYear() && index > today.getMonth()}
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Day Selector - For day timeframe */}
        {timeframe === 'day' && (
          <Select value={selectedDay.toString()} onValueChange={(v) => onDayChange(parseInt(v))}>
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {daysInMonth.map((day) => (
                <SelectItem
                  key={day}
                  value={day.toString()}
                  disabled={
                    selectedYear === today.getFullYear() &&
                    selectedMonth === today.getMonth() &&
                    day > today.getDate()
                  }
                >
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Quick Navigation */}
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onNavigateBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onNavigateForward}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Formatted Date Display */}
        <span className="text-sm font-medium text-muted-foreground ml-2">
          {formattedDate}
        </span>

        {/* Separator */}
        <div className="w-px h-6 bg-border ml-2" />

        {/* Location Selector */}
        <MapPin className="h-4 w-4 text-muted-foreground ml-2" />
        <Select value={selectedLocation} onValueChange={onLocationChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('overview.allLocations')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('overview.allLocations')}</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
