'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import {
  Globe,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Calendar,
  CreditCard,
  Instagram,
  Facebook,
  Twitter,
  ExternalLink,
  X,
  History,
  ShoppingCart,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import type { Tenant, Location, Website, OpeningHours } from '@/lib/types'
import { useMediaQuery } from '@/hooks/use-media-query'
import Link from 'next/link'

interface InfoSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCartOpen: () => void
  cartItemsCount?: number
  tenant: Tenant
  location?: Location
  website: Website | null
  theme: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
    fontHeading: string
    fontBody: string
  }
}

// Helper to get contrast color
const getContrastColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#18181B' : '#FAFAFA'
}

// Helper to format opening hours
const formatOpeningHours = (hours: OpeningHours, dayLabels: Record<string, string>, closedLabel: string) => {
  const days = [
    { key: 'monday', label: dayLabels.mon },
    { key: 'tuesday', label: dayLabels.tue },
    { key: 'wednesday', label: dayLabels.wed },
    { key: 'thursday', label: dayLabels.thu },
    { key: 'friday', label: dayLabels.fri },
    { key: 'saturday', label: dayLabels.sat },
    { key: 'sunday', label: dayLabels.sun },
  ] as const

  return days.map(day => {
    const dayHours = hours[day.key]
    if (dayHours?.is_closed) {
      return { label: day.label, time: closedLabel }
    }
    if (dayHours?.open && dayHours?.close) {
      return { label: day.label, time: `${dayHours.open} - ${dayHours.close}` }
    }
    return { label: day.label, time: '-' }
  })
}

export function InfoSidebar({
  isOpen,
  onClose,
  onCartOpen,
  cartItemsCount = 0,
  tenant,
  location,
  website,
  theme,
}: InfoSidebarProps) {
  const t = useTranslations('infoSidebar')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const cardBg = theme.secondary
  const borderColor = `${theme.foreground}15`
  const mutedForeground = `${theme.foreground}80`

  // Get website URL
  const websiteUrl = website?.custom_domain
    ? `https://${website.custom_domain}`
    : website?.subdomain
      ? `https://${website.subdomain}.klopay.app`
      : null

  // Social links
  const socialLinks = website?.social_links || {}

  const content = (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: theme.background, fontFamily: `${theme.fontBody}, sans-serif` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor }}
      >
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}
        >
          {t('about')}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{ backgroundColor: cardBg, color: theme.foreground }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Logo and name */}
        <div className="flex items-center gap-4">
          {(website?.logo_url || tenant.logo_url) ? (
            <div
              className="w-auto min-h-20 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-2"
              style={{ backgroundColor: cardBg }}
            >
              <Image
                src={website?.logo_url || tenant.logo_url || ''}
                alt={tenant.name}
                width={120}
                height={80}
                className="h-auto w-auto object-contain"
              />
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: theme.primary }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: getContrastColor(theme.primary) }}
              >
                {tenant.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3
              className="text-xl font-bold"
              style={{ fontFamily: `${theme.fontHeading}, sans-serif`, color: theme.foreground }}
            >
              {tenant.name}
            </h3>
            {tenant.description && (
              <p className="text-sm mt-1" style={{ color: mutedForeground }}>
                {tenant.description}
              </p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
            >
              <Globe className="h-4 w-4" />
              {t('website')}
            </a>
          )}
          {/* <button
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: cardBg, color: theme.foreground, border: `1px solid ${borderColor}` }}
            onClick={() => {
              // TODO: Implement leave review
              window.open('https://g.page/review', '_blank')
            }}
          >
            <Star className="h-4 w-4" />
            {t('review')}
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: cardBg, color: theme.foreground, border: `1px solid ${borderColor}` }}
            onClick={() => {
              // TODO: Implement reservation system
            }}
          >
            <Calendar className="h-4 w-4" />
            {t('bookTable')}
          </button> */}
          {/* <button
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}
            onClick={() => {
              // TODO: Implement pay at table
            }}
          >
            <CreditCard className="h-4 w-4" />
            {t('pay')}
          </button> */}
          <button
            className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: theme.accent, color: getContrastColor(theme.accent) }}
            onClick={() => {
              onClose()
              onCartOpen()
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            {t('cart')}
            {cartItemsCount > 0 && (
              <span
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-xs flex items-center justify-center font-semibold"
                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
              >
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          <h4
            className="text-sm font-semibold uppercase tracking-wide"
            style={{ color: mutedForeground }}
          >
            {t('contact')}
          </h4>
          <div className="space-y-2">
            {(location?.address || location?.city) && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  [location.address, location.city, location.country].filter(Boolean).join(', ')
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl transition-colors hover:opacity-80"
                style={{ backgroundColor: cardBg }}
              >
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                <div>
                  <p className="text-sm" style={{ color: theme.foreground }}>
                    {location.address}
                  </p>
                  {location.city && (
                    <p className="text-xs" style={{ color: mutedForeground }}>
                      {[location.city, location.postal_code, location.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 flex-shrink-0 ml-auto" style={{ color: mutedForeground }} />
              </a>
            )}
            {(location?.phone || tenant.phone) && (
              <a
                href={`tel:${location?.phone || tenant.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:opacity-80"
                style={{ backgroundColor: cardBg }}
              >
                <Phone className="h-5 w-5 flex-shrink-0" style={{ color: theme.primary }} />
                <span className="text-sm" style={{ color: theme.foreground }}>
                  {location?.phone || tenant.phone}
                </span>
              </a>
            )}
            {(location?.email || tenant.email) && (
              <a
                href={`mailto:${location?.email || tenant.email}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:opacity-80"
                style={{ backgroundColor: cardBg }}
              >
                <Mail className="h-5 w-5 flex-shrink-0" style={{ color: theme.primary }} />
                <span className="text-sm" style={{ color: theme.foreground }}>
                  {location?.email || tenant.email}
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Opening hours */}
        {location?.opening_hours && (
          <div className="space-y-3">
            <h4
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: mutedForeground }}
            >
              {t('openingHours')}
            </h4>
            <div
              className="p-3 rounded-xl space-y-2"
              style={{ backgroundColor: cardBg }}
            >
              {formatOpeningHours(location.opening_hours, {
                mon: t('mon'),
                tue: t('tue'),
                wed: t('wed'),
                thu: t('thu'),
                fri: t('fri'),
                sat: t('sat'),
                sun: t('sun'),
              }, t('closed')).map(({ label, time }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: mutedForeground }}>{label}</span>
                  <span
                    className="font-medium"
                    style={{ color: time === t('closed') ? theme.accent : theme.foreground }}
                  >
                    {time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        {(socialLinks.instagram || socialLinks.facebook || socialLinks.twitter) && (
          <div className="space-y-3">
            <h4
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: mutedForeground }}
            >
              {t('followUs')}
            </h4>
            <div className="flex gap-3">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ backgroundColor: cardBg }}
                >
                  <Instagram className="h-5 w-5" style={{ color: theme.foreground }} />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ backgroundColor: cardBg }}
                >
                  <Facebook className="h-5 w-5" style={{ color: theme.foreground }} />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl transition-colors hover:opacity-80"
                  style={{ backgroundColor: cardBg }}
                >
                  <Twitter className="h-5 w-5" style={{ color: theme.foreground }} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 border-t text-center"
        style={{ borderColor }}
      >
        <p className="text-xs" style={{ color: mutedForeground }}>
          {t('poweredBy')} <Link href={'https://klopay.app'} style={{ color: theme.primary }} target="_blank">Klopay</Link>
        </p>
      </div>
    </div>
  )

  // Desktop: Side drawer (Sheet)
  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full p-0 flex flex-col h-full overflow-hidden"
          style={{ backgroundColor: theme.background, borderColor }}
        >
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  // Mobile: Bottom drawer
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="max-h-[85vh]"
        style={{ backgroundColor: theme.background }}
      >
        {content}
      </DrawerContent>
    </Drawer>
  )
}
