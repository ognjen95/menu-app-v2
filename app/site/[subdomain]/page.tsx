import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6'
import { unstable_noStore as noStore } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { BlockRenderer } from '@/components/features/public-menu/block-renderer'
import { WebsiteLanguageSelector } from '@/components/features/public-menu/website-language-selector'
import type { Translation } from '@/lib/types'

// Public Supabase client (no auth required for public website)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  searchParams: Promise<{ page?: string; lang?: string }>
}

export default async function PublicWebsitePage({ params, searchParams }: PageProps) {
  // Disable caching to always get fresh data
  noStore()

  const { subdomain } = await params
  const { page: pageSlug, lang } = await searchParams
  const t = await getTranslations('blockRenderer')

  // Fetch website by subdomain with tenant join
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select(`
      *,
      tenant:tenants(id, name, slug)
    `)
    .eq('subdomain', subdomain)
    .eq('is_published', true)
    .single()

  if (websiteError || !website) {
    notFound()
  }

  const tenantId = (website.tenant as { id: string; name?: string; slug?: string })?.id

  // Fetch tenant languages
  const { data: tenantLanguages } = await supabase
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
    .order('is_default', { ascending: false })

  // Transform languages
  const languages: PublicLanguage[] = tenantLanguages?.map(tl => ({
    code: tl.language_code,
    isDefault: tl.is_default,
    name: (tl.languages as any)?.name || tl.language_code,
    nativeName: (tl.languages as any)?.native_name || tl.language_code,
    flagEmoji: (tl.languages as any)?.flag_emoji || '',
  })) || []

  // Determine current language
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('WEBSITE_LOCALE')?.value
  const defaultLang = languages.find(l => l.isDefault)?.code || languages[0]?.code || 'en'
  
  const getValidLanguage = (langCode: string | undefined) => {
    if (!langCode) return null
    return languages.some(l => l.code === langCode) ? langCode : null
  }
  
  const currentLanguage = getValidLanguage(lang) || getValidLanguage(cookieLocale) || defaultLang

  // Fetch pages for navigation
  const { data: pages } = await supabase
    .from('website_pages')
    .select('id, title, slug, is_in_navigation')
    .eq('website_id', website.id)
    .eq('is_published', true)
    .order('sort_order')

  // Get the current page (default to first page or 'home')
  const currentSlug = pageSlug || pages?.[0]?.slug || 'home'
  const currentPage = pages?.find(p => p.slug === currentSlug)

  // Fetch blocks for current page
  const { data: blocks } = currentPage ? await supabase
    .from('website_blocks')
    .select('*')
    .eq('page_id', currentPage.id)
    .eq('is_visible', true)
    .order('sort_order') : { data: [] }

  // Fetch translations for blocks and menu items
  let translations: Translation[] = []
  const { data: allTranslations } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantId)
    .or('key.like.website_block.%,key.like.menu_item.%')
  
  translations = allTranslations || []

  // Extract menu item IDs from menu_preview blocks
  const menuItemIds: string[] = []
  blocks?.forEach(block => {
    if (block.type === 'menu_preview' && block.content?.item_ids) {
      menuItemIds.push(...(block.content.item_ids as string[]))
    }
  })

  // Fetch menu items if needed
  let menuItemsMap: Record<string, { id: string; name: string; description: string | null; base_price: number; image_urls: string[] | null }> = {}
  if (menuItemIds.length > 0) {
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, description, base_price, image_urls')
      .in('id', menuItemIds)

    if (menuItems) {
      menuItemsMap = menuItems.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {} as typeof menuItemsMap)
    }
  }

  // Fetch locations for the tenant (needed for contact, hours, location blocks)
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, slug, address, city, postal_code, country, latitude, longitude, phone, email, opening_hours, is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name')

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

  const navPages = pages?.filter(p => p.is_in_navigation) || []

  const tenantName = (website.tenant as { id: string; name?: string; slug?: string })?.name
  const tenantSlug = (website.tenant as { id: string; name?: string; slug?: string })?.slug
  const menuLink = `/m/${tenantSlug}`

  return (
    <>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: theme.background,
        borderBottom: `1px solid ${theme.foreground}10`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <Link href={`/site/${subdomain}`} style={{ textDecoration: 'none' }}>
          {website.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={website.logo_url} alt={tenantName || 'Logo'} style={{ height: 40 }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Language Selector */}
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
            View Menu
          </Link>
        </div>
      </nav>

      {/* Page Content - Render Blocks */}
      <main>
        {blocks?.map((block) => (
          <BlockRenderer 
            key={block.id} 
            block={block} 
            theme={theme} 
            menuItems={menuItemsMap} 
            menuLink={menuLink} 
            locations={locations || []} 
            t={t}
            translations={translations}
            currentLanguage={currentLanguage}
          />
        ))}

        {(!blocks || blocks.length === 0) && (
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

      {/* Footer */}
      <footer style={{
        backgroundColor: theme.secondary,
        padding: '3rem 2rem',
        marginTop: '4rem',
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
          <p>© {new Date().getFullYear()} {tenantName}. Powered by Klopay.app</p>
        </div>
      </footer>
    </>
  )
}

// Block Renderer Component

