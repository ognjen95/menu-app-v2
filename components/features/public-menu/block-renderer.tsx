import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedinIn, FaYelp } from "react-icons/fa6";
import { SiTripadvisor } from "react-icons/si";
import { GalleryBlock } from "../GalleryBlock";

export function BlockRenderer({ block, theme, menuItems, menuLink }: {
  block: { type: string; content: Record<string, unknown>; settings: Record<string, unknown> }
  theme: { primary: string; secondary: string; background: string; foreground: string; accent: string; fontHeading: string; fontBody: string }
  menuItems: Record<string, { id: string; name: string; description: string | null; base_price: number; image_urls: string[] | null }>
  menuLink: string
}) {
  const content = block.content || {}

  const sectionPadding = block.settings?.padding === 'large' ? '6rem 0' : '4rem 0'
  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
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
                href={menuLink}
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
        <section style={{ padding: sectionPadding }}>
          <div style={{ ...contentStyle, display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
        <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
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
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
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
            background: theme.background,
            fontHeading: theme.fontHeading,
            fontBody: theme.fontBody,
          }}
        />
      )

    case 'testimonials':
      const testimonials = (content.testimonials as { image?: string; name: string; text: string }[]) || []
      return (
        <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
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
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
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
          </div>
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
        <section style={{ padding: sectionPadding }}>
          <div style={{ ...contentStyle, textAlign: 'center' }}>
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
          </div>
        </section>
      )

    default:
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
              {String(content.title || '')}
            </h2>
            <p>{String(content.text || '')}</p>
          </div>
        </section>
      )
  }
}