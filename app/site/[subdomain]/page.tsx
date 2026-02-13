import Link from 'next/link'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import dynamic from 'next/dynamic'
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6'
import { unstable_noStore as noStore } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { WebsiteNavbar } from '@/components/features/public-menu/website-navbar'
import { WebsiteBlocksContent } from './components/website-blocks-content'
import { WebsiteBlocksSkeleton } from './components/website-blocks-skeleton'
import type { Translation } from '@/lib/types'
import { getWebsiteBySubdomain, supabase } from './utils'

// Lazy load PreviewSync - only needed in preview mode
const PreviewSync = dynamic(
  () => import('@/components/features/website-builder/PreviewSync').then(mod => mod.PreviewSync),
  { ssr: false }
)

// Language type for public website
type PublicLanguage = {
  code: string
  isDefault: boolean
  name: string
  nativeName: string
  flagEmoji: string
}

type PageProps = {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ page?: string; lang?: string; preview?: string }>
}

export default async function PublicWebsitePage({ params, searchParams }: PageProps) {
  // Disable caching to always get fresh data
  noStore()

  const { subdomain } = await params
  const { page: pageSlug, lang, preview } = await searchParams
  const t = await getTranslations('blockRenderer')
  const isPreview = preview === 'true'

  const { tenant, website } = await getWebsiteBySubdomain(subdomain, isPreview)
  const tenantId = tenant.id

  // Fetch independent data in parallel (all depend only on tenantId or website.id)
  // Using Promise.allSettled for resilience - partial failures won't break the page
  const [
    tenantLanguagesResult,
    pagesResult,
    translationsResult,
    locationsResult
  ] = await Promise.allSettled([
    // Fetch tenant languages
    supabase
      .from('tenant_languages')
      .select(`
        language_code,
        is_default,
        is_enabled,
        languages (
          code,
          name,
          native_name,
          flag_emoji
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true)
      .order('is_default', { ascending: false }),

    // Fetch pages for navigation
    supabase
      .from('website_pages')
      .select('id, title, slug, is_in_navigation')
      .eq('website_id', website.id)
      .eq('is_published', true)
      .order('sort_order'),

    // Fetch translations for blocks, menu items, and pages
    supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenantId)
      .or('key.like.website_block.%,key.like.menu_item.%,key.like.website_page.%'),

    // Fetch locations for the tenant (needed for contact, hours, location blocks)
    supabase
      .from('locations')
      .select('id, name, slug, address, city, postal_code, country, latitude, longitude, phone, email, opening_hours, is_active')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')
  ])

  // Get cookies separately (critical for language detection)
  const cookieStore = await cookies()

  // Extract results with graceful fallbacks
  const tenantLanguages = tenantLanguagesResult.status === 'fulfilled' ? tenantLanguagesResult.value.data : null
  const pages = pagesResult.status === 'fulfilled' ? pagesResult.value.data : null
  const translations: Translation[] = translationsResult.status === 'fulfilled' ? (translationsResult.value.data || []) : []
  const locations = locationsResult.status === 'fulfilled' ? locationsResult.value.data : null

  // Transform languages
  const languages: PublicLanguage[] = tenantLanguages?.map((tl: any) => ({
    code: tl.language_code,
    isDefault: tl.is_default,
    name: (tl.languages as any)?.name || tl.language_code,
    nativeName: (tl.languages as any)?.native_name || tl.language_code,
    flagEmoji: (tl.languages as any)?.flag_emoji || '',
  })) || []

  // Determine current language
  const cookieLocale = cookieStore.get('WEBSITE_LOCALE')?.value
  const defaultLang = languages.find((l: PublicLanguage) => l.isDefault)?.code || languages[0]?.code || 'en'

  const getValidLanguage = (langCode: string | undefined) => {
    if (!langCode) return null
    return languages.some((l: PublicLanguage) => l.code === langCode) ? langCode : null
  }

  const currentLanguage = getValidLanguage(lang) || getValidLanguage(cookieLocale) || defaultLang

  // Get the current page (default to first page or 'home')
  const currentSlug = pageSlug || pages?.[0]?.slug || 'home'
  const currentPage = pages?.find((p: any) => p.slug === currentSlug)

  // Theme styles
  const theme = {
    primary: website.primary_color || '#3B82F6',
    secondary: website.secondary_color || '#F4F4F5',
    background: website.background_color || '#FFFFFF',
    foreground: website.foreground_color || '#18181B',
    accent: website.accent_color || '#F97316',
    fontHeading: website.font_heading || 'Inter',
    fontBody: website.font_body || 'Inter',
  }

  // Apply translations to page titles
  const getPageTitle = (page: { id: string; title: string }) => {
    const translationKey = `website_page.${page.id}.title`
    const translation = translations.find(
      t => t.key === translationKey && t.language_code === currentLanguage
    )
    return translation?.value || page.title
  }

  const navPages = pages?.filter(p => p.is_in_navigation).map(p => ({
    ...p,
    title: getPageTitle(p)
  })) || []

  const tenantName = tenant.name
  const tenantSlug = tenant.slug
  const menuLink = `/m/${tenantSlug}`

  return (
    <>
      {/* Preview sync - notifies builder of page navigation */}
      {isPreview && <PreviewSync pageSlug={currentSlug} />}

      {/* Navigation */}
      <WebsiteNavbar
        subdomain={subdomain}
        tenantName={tenantName}
        tenantSlug={tenantSlug}
        logoUrl={website.logo_url}
        navPages={navPages}
        currentSlug={currentSlug}
        languages={languages}
        currentLanguage={currentLanguage}
        theme={theme}
        viewMenuText={t('viewMenu')}
      />

      {/* Page Content - Stream Blocks with Suspense */}
      <Suspense fallback={<WebsiteBlocksSkeleton theme={theme} />}>
        <main>
          {currentPage ? (
            <WebsiteBlocksContent
              pageId={currentPage.id}
              theme={theme}
              menuLink={menuLink}
              locations={locations || []}
              translations={translations}
              currentLanguage={currentLanguage}
              tenantName={tenantName}
              t={t}
            />
          ) : (
            <div style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              minHeight: '50vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <h1 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
                Welcome to {tenantName}
              </h1>
              <p style={{ color: theme.foreground, opacity: 0.7 }}>
                This page is being set up. Check back soon!
              </p>
              <Link
                href={`/m/${tenantSlug}`}
                style={{
                  marginTop: '2rem',
                  backgroundColor: theme.primary,
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                View Our Menu
              </Link>
            </div>
          )}
        </main>
      </Suspense>

      {/* Footer */}
      <footer style={{
        backgroundColor: theme.secondary,
        padding: '3rem 2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem',
        }}>
          <div>
            <h3 style={{ fontFamily: theme.fontHeading, marginBottom: '1rem' }}>
              {tenantName}
            </h3>
            <p style={{ opacity: 0.7, maxWidth: '300px' }}>
              {website.seo_description || 'Thank you for visiting our website.'}
            </p>
          </div>

          {website.social_links && Object.keys(website.social_links).length > 0 && (
            <div>
              <h4 style={{ fontFamily: theme.fontHeading, marginBottom: '1rem' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {website.social_links.facebook && (
                  <a href={website.social_links.facebook} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
                    <FaFacebookF size={22} />
                  </a>
                )}
                {website.social_links.instagram && (
                  <a href={website.social_links.instagram} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
                    <FaInstagram size={22} />
                  </a>
                )}
                {website.social_links.twitter && (
                  <a href={website.social_links.twitter} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
                    <FaXTwitter size={22} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: `1px solid ${theme.foreground}20`,
          opacity: 0.6,
        }}>
          <p>© {new Date().getFullYear()} {tenantName}. <Link href={'klopay.app'}>Powered by Klopay.app</Link></p>
        </div>
      </footer>
    </>
  )
}

// Block Renderer Component

