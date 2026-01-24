import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedinIn, FaYelp } from 'react-icons/fa6'
import { SiTripadvisor } from 'react-icons/si'
import { unstable_noStore as noStore } from 'next/cache'
import { GalleryBlock } from '@/components/features/GalleryBlock'

// Public Supabase client (no auth required for public website)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type PageProps = {
  params: Promise<{ subdomain: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function PublicWebsitePage({ params, searchParams }: PageProps) {
  // Disable caching to always get fresh data
  noStore()

  const { subdomain } = await params
  const { page: pageSlug } = await searchParams

  // Fetch website by subdomain with tenant join
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select(`
      *,
      tenant:tenants(name, slug)
    `)
    .eq('subdomain', subdomain)
    .eq('is_published', true)
    .single()

  if (websiteError || !website) {
    notFound()
  }

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

  const tenantName = (website.tenant as { name?: string; slug?: string })?.name
  const tenantSlug = (website.tenant as { name?: string; slug?: string })?.slug

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
          <BlockRenderer key={block.id} block={block} theme={theme} menuItems={menuItemsMap} />
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
          <p>© {new Date().getFullYear()} {tenantName}. Powered by QR Menu</p>
        </div>
      </footer>
    </>
  )
}

// Block Renderer Component
function BlockRenderer({ block, theme, menuItems }: {
  block: { type: string; content: Record<string, unknown>; settings: Record<string, unknown> }
  theme: { primary: string; secondary: string; background: string; foreground: string; accent: string; fontHeading: string; fontBody: string }
  menuItems: Record<string, { id: string; name: string; description: string | null; base_price: number; image_urls: string[] | null }>
}) {
  const content = block.content || {}

  const sectionStyle: React.CSSProperties = {
    padding: block.settings?.padding === 'large' ? '6rem 2rem' : '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  }

  switch (block.type) {
    case 'hero':
      return (
        <section style={{
          backgroundImage: content.image_url ? `url(${content.image_url})` : undefined,
          backgroundColor: content.image_url ? undefined : theme.secondary,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
        }}>
          {Boolean(content.image_url) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
            }} />
          )}
          <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            <h1 style={{
              fontFamily: theme.fontHeading,
              fontSize: '3rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: content.image_url ? '#fff' : theme.foreground,
            }}>
              {String(content.headline || 'Welcome')}
            </h1>
            {Boolean(content.subheadline) && (
              <p style={{
                fontSize: '1.25rem',
                marginBottom: '2rem',
                color: content.image_url ? '#fff' : theme.foreground,
                opacity: 0.9,
              }}>
                {String(content.subheadline)}
              </p>
            )}
            {Boolean(content.button_text) && (
              <a
                href={String(content.button_link || '#')}
                style={{
                  backgroundColor: theme.primary,
                  color: '#fff',
                  padding: '0.75rem 2rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block',
                }}
              >
                {String(content.button_text)}
              </a>
            )}
          </div>
        </section>
      )

    case 'about':
      return (
        <section style={sectionStyle}>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {Boolean(content.image_url) && (
              <div style={{ flex: '1', minWidth: '300px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={String(content.image_url)}
                  alt={String(content.title || 'About')}
                  style={{ width: '100%', borderRadius: '1rem' }}
                />
              </div>
            )}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
                {String(content.title || 'About Us')}
              </h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                {String(content.text || '')}
              </p>
            </div>
          </div>
        </section>
      )

    case 'contact':
      return (
        <section style={{ ...sectionStyle, backgroundColor: theme.secondary, maxWidth: '100%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'Contact Us')}
            </h2>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Boolean(content.address) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={20} color={theme.primary} />
                  <span>{String(content.address)}</span>
                </div>
              )}
              {Boolean(content.phone) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={20} color={theme.primary} />
                  <a href={`tel:${content.phone}`} style={{ color: theme.foreground, textDecoration: 'none' }}>
                    {String(content.phone)}
                  </a>
                </div>
              )}
              {Boolean(content.email) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={20} color={theme.primary} />
                  <a href={`mailto:${content.email}`} style={{ color: theme.foreground, textDecoration: 'none' }}>
                    {String(content.email)}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )

    case 'hours':
      return (
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {String(content.title || 'Opening Hours')}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}>
            <Clock size={24} color={theme.primary} />
            <pre style={{
              fontFamily: theme.fontBody,
              whiteSpace: 'pre-wrap',
              margin: 0,
              opacity: 0.8,
            }}>
              {String(content.hours_text || '')}
            </pre>
          </div>
        </section>
      )

    case 'gallery':
      const images = (content.images as string[]) || []
      return (
        <GalleryBlock
          images={images}
          title={String(content.title || 'Gallery')}
          theme={{
            primary: theme.primary,
            secondary: theme.secondary,
            fontHeading: theme.fontHeading,
            fontBody: theme.fontBody,
          }}
        />
      )

    case 'testimonials':
      const testimonials = (content.testimonials as { image?: string; name: string; text: string }[]) || []
      return (
        <section style={{ ...sectionStyle, backgroundColor: theme.secondary, maxWidth: '100%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'What Our Guests Say')}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}>
              {testimonials.map((t, idx) => (
                <div key={idx} style={{
                  backgroundColor: theme.background,
                  padding: '1.5rem',
                  borderRadius: '1rem',
                }}>
                  <p style={{ fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.6 }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {t.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.image}
                        alt={t.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    )}
                    <p style={{ fontWeight: 600, margin: 0 }}>{t.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    case 'menu_preview':
      const itemIds = (content.item_ids as string[]) || []
      const selectedItems = itemIds.map(id => menuItems[id]).filter(Boolean)
      return (
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
            {String(content.title || 'Featured Menu Items')}
          </h2>
          {selectedItems.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
              {selectedItems.map((item) => (
                <div key={item.id} style={{
                  backgroundColor: theme.secondary,
                  borderRadius: '1rem',
                  overflow: 'hidden',
                }}>
                  {item.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_urls[0]}
                      alt={item.name}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>
                        {item.name}
                      </h3>
                      <span style={{ color: theme.primary, fontWeight: 600 }}>
                        ${item.base_price.toFixed(2)}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.6 }}>No menu items selected</p>
          )}
        </section>
      )

    case 'social':
      const socialLinks = (content.links as Record<string, string>) || {}
      const activeSocials = Object.entries(socialLinks).filter(([, url]) => url)
      const getSocialIcon = (platform: string) => {
        const iconMap: Record<string, React.ReactNode> = {
          facebook: <FaFacebookF size={22} />,
          instagram: <FaInstagram size={22} />,
          twitter: <FaXTwitter size={22} />,
          tiktok: <FaTiktok size={22} />,
          youtube: <FaYoutube size={22} />,
          linkedin: <FaLinkedinIn size={22} />,
          yelp: <FaYelp size={22} />,
          tripadvisor: <SiTripadvisor size={22} />,
        }
        return iconMap[platform] || <MapPin size={22} />
      }
      const getSocialLabel = (platform: string) => {
        const labels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', twitter: 'X', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', yelp: 'Yelp', tripadvisor: 'TripAdvisor' }
        return labels[platform] || platform
      }
      return (
        <section style={{ ...sectionStyle, textAlign: 'center' }}>
          <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem' }}>
            {String(content.title || 'Follow Us')}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {activeSocials.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: theme.foreground,
                  textDecoration: 'none',
                  padding: '1rem',
                  borderRadius: '1rem',
                  backgroundColor: theme.secondary,
                  minWidth: '80px',
                  transition: 'transform 0.2s',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: theme.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}>
                  {getSocialIcon(platform)}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{getSocialLabel(platform)}</span>
              </a>
            ))}
          </div>
          {activeSocials.length === 0 && (
            <p style={{ opacity: 0.6 }}>No social links configured</p>
          )}
        </section>
      )

    default:
      return (
        <section style={sectionStyle}>
          <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
            {String(content.title || '')}
          </h2>
          <p>{String(content.text || '')}</p>
        </section>
      )
  }
}
