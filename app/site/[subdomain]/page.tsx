import Link from 'next/link'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import dynamic from 'next/dynamic'
import { unstable_noStore as noStore } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { WebsiteNavbar } from '@/features/public-menu/website-navbar'
import { WebsiteBlocksContent } from './components/website-blocks-content'
import { WebsiteBlocksSkeleton } from './components/website-blocks-skeleton'
import { WebsiteFooter } from './components/website-footer'
import { PublicIntlProvider } from '@/components/providers/public-intl-provider'
import { CookieLocale, defaultLocale } from '@/i18n/config'
import type { Translation } from '@/lib/types'
import { getWebsiteBySubdomain, supabase } from './utils'
import { getPublicLocaleFromCookies } from '@/i18n/request-public'

export const revalidate = 300 // Revalidate every 10 minutes

// Lazy load PreviewSync - only needed in preview mode
const PreviewSync = dynamic(
  () => import('@/features/website-builder/PreviewSync').then(mod => mod.PreviewSync),
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
  const { subdomain } = await params
  const resolvedSearchParams = await searchParams
  const { page: pageSlug, lang, preview } = resolvedSearchParams
  const t = await getTranslations('blockRenderer')

  // Preview mode allows viewing unpublished websites in the builder iframe
  // Handle various truthy values for preview parameter
  const isPreview = preview === 'true' || preview === '1' || preview === 'yes'

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

  const { locale, messages } = await getPublicLocaleFromCookies()
  const currentLanguage = locale


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
    <PublicIntlProvider locale={locale} messages={messages}>
      <>
        {/* Preview sync - notifies builder of page navigation */}
        {isPreview && <PreviewSync pageSlug={currentSlug} />}

        {/* Navigation */}
        <WebsiteNavbar
          subdomain={subdomain}
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          logoUrl={website.logo_url}
          navPages={navPages}
          currentSlug={currentSlug}
          languages={languages}
          currentLanguage={locale}
          theme={theme}
          viewMenuText={t('viewMenu')}
        />

        {/* Page Content - Stream Blocks with Suspense */}
        <Suspense fallback={<WebsiteBlocksSkeleton theme={theme} />}>
          <main>
            {currentPage?.id && (
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
            )}
          </main>
        </Suspense>

        {/* Footer */}
        <WebsiteFooter
          tenantName={tenantName}
          seoDescription={website.seo_description}
          socialLinks={website.social_links}
          theme={theme}
        />
      </>
    </PublicIntlProvider>
  )
}

// Block Renderer Component

