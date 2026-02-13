'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { WebsiteLanguageSelector } from './website-language-selector'

type NavPage = {
  id: string
  slug: string
  title: string
}

type Language = {
  code: string
  isDefault: boolean
  name: string
  nativeName: string
  flagEmoji: string
}

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

interface WebsiteNavbarProps {
  subdomain: string
  tenantName: string
  tenantSlug: string
  logoUrl?: string | null
  navPages: NavPage[]
  currentSlug: string
  languages: Language[]
  currentLanguage: string
  theme: Theme
  viewMenuText?: string
}

export function WebsiteNavbar({
  subdomain,
  tenantName,
  tenantSlug,
  logoUrl,
  navPages,
  currentSlug,
  languages,
  currentLanguage,
  theme,
  viewMenuText = 'View Menu',
}: WebsiteNavbarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  // Detect mobile screen size - use null initially to prevent flash
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't render nav items until we know screen size to prevent flash
  const showDesktop = isMobile === false
  const showMobile = isMobile === true

  return (
    <>
      <nav
      className='shadow' 
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: theme.background,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <Link href={`/site/${subdomain}`} style={{ textDecoration: 'none' }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={tenantName || 'Logo'} style={{ height: 40 }} />
          ) : (
            <span style={{
              fontFamily: theme.fontHeading,
              fontWeight: 700,
              fontSize: '1.25rem',
              color: theme.foreground,
              letterSpacing: '-0.02em',
            }}>
              {tenantName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation - hidden on mobile */}
        {showDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {navPages.map((navPage) => (
              <Link
                key={navPage.id}
                href={`/site/${subdomain}?page=${navPage.slug}`}
                style={{
                  color: navPage.slug === currentSlug ? theme.primary : theme.foreground,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: navPage.slug === currentSlug ? `${theme.primary}15` : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {navPage.title}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop Right Side - hidden on mobile */}
        {showDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {languages.length > 1 && (
              <WebsiteLanguageSelector
                languages={languages}
                currentLanguage={currentLanguage}
                subdomain={subdomain}
                currentPage={currentSlug}
                theme={theme}
              />
            )}
            <Link
              href={`/m/${tenantSlug}`}
              prefetch
              style={{
                backgroundColor: theme.primary,
                color: '#fff',
                padding: '0.6rem 1.25rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                marginLeft: '0.5rem',
                boxShadow: `0 2px 8px ${theme.primary}40`,
                transition: 'all 0.2s ease',
              }}
            >
              {viewMenuText}
            </Link>
          </div>
        )}

        {/* Mobile Right Side - language selector + menu button */}
        {showMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {languages.length > 1 && (
              <WebsiteLanguageSelector
                languages={languages}
                currentLanguage={currentLanguage}
                subdomain={subdomain}
                currentPage={currentSlug}
                theme={theme}
              />
            )}
            <button
              onClick={() => setIsDrawerOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                color: theme.foreground,
              }}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 200,
          }}
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          backgroundColor: theme.background,
          zIndex: 300,
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDrawerOpen ? '-4px 0 20px rgba(0, 0, 0, 0.15)' : 'none',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: `1px solid ${theme.foreground}10`,
          }}
        >
          <Link
            href={`/site/${subdomain}`}
            style={{ textDecoration: 'none' }}
            onClick={() => setIsDrawerOpen(false)}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={tenantName || 'Logo'} style={{ height: 32 }} />
            ) : (
              <span style={{
                fontFamily: theme.fontHeading,
                fontWeight: 700,
                fontSize: '1.1rem',
                color: theme.foreground,
                letterSpacing: '-0.02em',
              }}>
                {tenantName}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              color: theme.foreground,
            }}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drawer Navigation Links */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
          {navPages.map((navPage) => (
            <Link
              key={navPage.id}
              href={`/site/${subdomain}?page=${navPage.slug}`}
              onClick={() => setIsDrawerOpen(false)}
              style={{
                display: 'block',
                color: navPage.slug === currentSlug ? theme.primary : theme.foreground,
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                padding: '0.875rem 1.5rem',
                backgroundColor: navPage.slug === currentSlug ? `${theme.primary}10` : 'transparent',
                borderLeft: navPage.slug === currentSlug ? `3px solid ${theme.primary}` : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {navPage.title}
            </Link>
          ))}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '1.5rem',
            borderTop: `1px solid ${theme.foreground}10`,
            width: '100%',
          }}
        >
          {/* View Menu Button */}
          <Link
            prefetch
            href={`/m/${tenantSlug}`}
            onClick={() => setIsDrawerOpen(false)}
            style={{
              display: 'block',
              backgroundColor: theme.primary,
              color: '#fff',
              padding: '0.875rem 1.5rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              textAlign: 'center',
              boxShadow: `0 4px 12px ${theme.primary}30`,
              transition: 'all 0.2s ease',
              width: '100%',
            }}
          >
            {viewMenuText}
          </Link>
        </div>
      </div>
    </>
  )
}
