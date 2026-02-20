'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

type PublicLanguage = {
  code: string
  isDefault: boolean
  name: string
  nativeName: string
  flagEmoji: string
}

interface WebsiteLanguageSelectorProps {
  languages: PublicLanguage[]
  currentLanguage: string
  subdomain: string
  currentPage: string
  hideChevron?: boolean
  theme: {
    primary: string
    secondary: string
    background: string
    foreground: string
    accent: string
  }
}

export function WebsiteLanguageSelector({
  languages,
  currentLanguage,
  subdomain,
  currentPage,
  hideChevron = false,
  theme,
}: WebsiteLanguageSelectorProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0]

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    // Set WEBSITE_LOCALE cookie (expires in 1 year)
    document.cookie = `WEBSITE_LOCALE=${langCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    
    // Build URL with new lang param
    const params = new URLSearchParams()
    if (currentPage && currentPage !== 'home') {
      params.set('page', currentPage)
    }
    params.set('lang', langCode)
    
    const newUrl = `/site/${subdomain}?${params.toString()}`
    setIsOpen(false)
    router.push(newUrl)
    router.refresh()
  }

  if (languages.length <= 1) {
    return null
  }

  // Calculate light/dark text based on background
  const bgLuminance = parseInt(theme.background.slice(1, 3), 16) * 0.299 +
    parseInt(theme.background.slice(3, 5), 16) * 0.587 +
    parseInt(theme.background.slice(5, 7), 16) * 0.114
  const isDarkBg = bgLuminance < 128
  const borderColor = isDarkBg 
    ? `${theme.foreground}30` 
    : `${theme.foreground}20`

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: `1px solid ${borderColor}`,
          backgroundColor: 'transparent',
          color: theme.foreground,
          fontSize: '0.875rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{currentLang?.flagEmoji}</span>
        <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } } as any}>
          {currentLang?.nativeName}
        </span>
        {!hideChevron && <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
          }} 
        />}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '0.25rem',
              zIndex: 50,
              minWidth: '140px',
              padding: '0.25rem',
              borderRadius: '0.5rem',
              backgroundColor: theme.background,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  backgroundColor: lang.code === currentLanguage 
                    ? `${theme.primary}15` 
                    : 'transparent',
                  color: theme.foreground,
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (lang.code !== currentLanguage) {
                    e.currentTarget.style.backgroundColor = `${theme.foreground}10`
                  }
                }}
                onMouseLeave={(e) => {
                  if (lang.code !== currentLanguage) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ fontSize: '1rem' }}>{lang.flagEmoji}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
