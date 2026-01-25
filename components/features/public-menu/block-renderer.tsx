import { MapPin, Phone, Mail, Clock, Calendar, Sparkles, Wifi, ParkingCircle, Music, Dog, Baby, Accessibility, CreditCard, Utensils, Wine, Coffee, Leaf, Play } from "lucide-react";
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedinIn, FaYelp } from "react-icons/fa6";
import { SiTripadvisor } from "react-icons/si";
import { GalleryBlock } from "../GalleryBlock";

// Feature icons mapping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FEATURE_ICONS: Record<string, any> = {
  wifi: Wifi,
  parking: ParkingCircle,
  music: Music,
  pets: Dog,
  kids: Baby,
  accessible: Accessibility,
  cards: CreditCard,
  outdoor: Utensils,
  bar: Wine,
  coffee: Coffee,
  vegan: Leaf,
};

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

    case 'specials':
      const specials = (content.items as { name: string; description?: string; price?: string; day?: string; image_url?: string }[]) || []
      return (
        <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Sparkles size={32} color={theme.primary} style={{ margin: '0 auto 0.5rem' }} />
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem' }}>
                {String(content.title || "Today's Specials")}
              </h2>
              {Boolean(content.subtitle) && (
                <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>{String(content.subtitle)}</p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {specials.map((item, idx) => (
                <div key={idx} style={{ backgroundColor: theme.background, borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {item.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '1.25rem' }}>
                    {item.day && <span style={{ fontSize: '0.75rem', color: theme.primary, fontWeight: 600, textTransform: 'uppercase' }}>{item.day}</span>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                      <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>{item.name}</h3>
                      {item.price && <span style={{ color: theme.primary, fontWeight: 700 }}>{item.price}</span>}
                    </div>
                    {item.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', margin: 0 }}>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            {specials.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No specials configured</p>}
          </div>
        </section>
      )

    case 'events':
      const events = (content.events as { title: string; date: string; time?: string; description?: string; image_url?: string }[]) || []
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'Upcoming Events')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {events.map((event, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1.5rem', backgroundColor: theme.secondary, borderRadius: '1rem', overflow: 'hidden', flexWrap: 'wrap' }}>
                  {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.image_url} alt={event.title} style={{ width: '200px', height: '150px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ padding: '1.25rem', flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Calendar size={16} color={theme.primary} />
                      <span style={{ fontSize: '0.875rem', color: theme.primary, fontWeight: 500 }}>{event.date}{event.time && ` • ${event.time}`}</span>
                    </div>
                    <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, fontSize: '1.25rem', margin: 0 }}>{event.title}</h3>
                    {event.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>{event.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            {events.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No events scheduled</p>}
          </div>
        </section>
      )

    case 'reservation':
      return (
        <section style={{
          padding: sectionPadding,
          backgroundImage: content.background_image ? `url(${content.background_image})` : undefined,
          backgroundColor: content.background_image ? undefined : theme.primary,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}>
          {Boolean(content.background_image) && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />}
          <div style={{ ...contentStyle, position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2.5rem', color: '#fff', marginBottom: '1rem' }}>
              {String(content.title || 'Make a Reservation')}
            </h2>
            {Boolean(content.subtitle) && (
              <p style={{ fontSize: '1.125rem', color: '#fff', opacity: 0.9, marginBottom: '2rem' }}>{String(content.subtitle)}</p>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Boolean(content.phone) && (
                <a href={`tel:${content.phone}`} style={{
                  backgroundColor: '#fff',
                  color: theme.primary,
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <Phone size={20} /> {String(content.phone)}
                </a>
              )}
              {Boolean(content.booking_url) && (
                <a href={String(content.booking_url)} target="_blank" rel="noopener noreferrer" style={{
                  backgroundColor: 'transparent',
                  border: '2px solid #fff',
                  color: '#fff',
                  padding: '1rem 2rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}>
                  {String(content.button_text || 'Book Online')}
                </a>
              )}
            </div>
          </div>
        </section>
      )

    case 'features':
      const features = (content.features as { icon: string; title: string; description?: string }[]) || []
      return (
        <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'What We Offer')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
              {features.map((feature, idx) => {
                const IconComponent = FEATURE_ICONS[feature.icon] || Sparkles
                return (
                  <div key={idx} style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: theme.background, borderRadius: '1rem' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${theme.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <IconComponent size={28} color={theme.primary} />
                    </div>
                    <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
                    {feature.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>{feature.description}</p>}
                  </div>
                )
              })}
            </div>
            {features.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No features configured</p>}
          </div>
        </section>
      )

    case 'video':
      const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com/watch')) {
          const videoId = url.split('v=')[1]?.split('&')[0]
          return `https://www.youtube.com/embed/${videoId}`
        }
        if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1]?.split('?')[0]
          return `https://www.youtube.com/embed/${videoId}`
        }
        if (url.includes('vimeo.com/')) {
          const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
          return `https://player.vimeo.com/video/${videoId}`
        }
        return url
      }
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            {Boolean(content.title) && (
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                {String(content.title)}
              </h2>
            )}
            {Boolean(content.video_url) ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '1rem', overflow: 'hidden' }}>
                <iframe
                  src={getEmbedUrl(String(content.video_url))}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: theme.secondary, borderRadius: '1rem' }}>
                <Play size={48} color={theme.primary} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p style={{ opacity: 0.6 }}>No video URL configured</p>
              </div>
            )}
          </div>
        </section>
      )

    case 'cta':
      return (
        <section style={{
          padding: sectionPadding,
          backgroundColor: content.background_color ? String(content.background_color) : theme.primary,
          textAlign: 'center',
        }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', color: '#fff', marginBottom: '1rem' }}>
              {String(content.title || 'Ready to Visit?')}
            </h2>
            {Boolean(content.subtitle) && (
              <p style={{ fontSize: '1.125rem', color: '#fff', opacity: 0.9, marginBottom: '2rem' }}>{String(content.subtitle)}</p>
            )}
            {Boolean(content.button_text) && (
              <a href={String(content.button_url || menuLink)} style={{
                backgroundColor: '#fff',
                color: theme.primary,
                padding: '1rem 2.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
              }}>
                {String(content.button_text)}
              </a>
            )}
          </div>
        </section>
      )

    case 'team':
      const members = (content.members as { name: string; role: string; image_url?: string; bio?: string }[]) || []
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'Meet Our Team')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
              {members.map((member, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  {member.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.image_url} alt={member.name} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1rem', border: `3px solid ${theme.primary}` }} />
                  ) : (
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: theme.secondary, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem', opacity: 0.5 }}>{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, marginBottom: '0.25rem' }}>{member.name}</h3>
                  <p style={{ color: theme.primary, fontSize: '0.875rem', fontWeight: 500 }}>{member.role}</p>
                  {member.bio && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.75rem' }}>{member.bio}</p>}
                </div>
              ))}
            </div>
            {members.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No team members added</p>}
          </div>
        </section>
      )

    case 'text':
      return (
        <section style={{ padding: sectionPadding, backgroundColor: content.use_secondary_bg ? theme.secondary : 'transparent' }}>
          <div style={{ ...contentStyle, textAlign: (content.alignment as 'left' | 'center' | 'right') || 'left' }}>
            {Boolean(content.title) && (
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
                {String(content.title)}
              </h2>
            )}
            <div style={{ lineHeight: 1.8, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
              {String(content.text || '')}
            </div>
          </div>
        </section>
      )

    case 'location':
      return (
        <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {String(content.title || 'Find Us')}
            </h2>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '280px' }}>
                {Boolean(content.image_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={String(content.image_url)} alt="Location" style={{ width: '100%', borderRadius: '1rem', marginBottom: '1.5rem' }} />
                )}
                {Boolean(content.address) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                    <MapPin size={20} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(content.address)}</p>
                  </div>
                )}
                {Boolean(content.directions) && (
                  <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '1rem' }}>{String(content.directions)}</p>
                )}
              </div>
              {Boolean(content.map_embed) && (
                <div style={{ flex: '2', minWidth: '300px', height: '300px', borderRadius: '1rem', overflow: 'hidden' }}>
                  <iframe
                    src={String(content.map_embed)}
                    style={{ width: '100%', height: '100%', border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )

    case 'drinks':
      const drinks = (content.drinks as { name: string; description?: string; price: string; category?: string }[]) || []
      const drinkCategories = Array.from(new Set(drinks.map(d => d.category || 'Drinks')))
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <Wine size={32} color={theme.primary} style={{ margin: '0 auto 0.5rem' }} />
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem' }}>
                {String(content.title || 'Drinks Menu')}
              </h2>
            </div>
            {drinkCategories.map(category => (
              <div key={category} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontFamily: theme.fontHeading, fontSize: '1.25rem', color: theme.primary, marginBottom: '1rem', borderBottom: `2px solid ${theme.primary}`, paddingBottom: '0.5rem' }}>{category}</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {drinks.filter(d => (d.category || 'Drinks') === category).map((drink, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem', backgroundColor: theme.secondary, borderRadius: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, margin: 0 }}>{drink.name}</h4>
                        {drink.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0.25rem 0 0' }}>{drink.description}</p>}
                      </div>
                      <span style={{ fontWeight: 600, color: theme.primary, whiteSpace: 'nowrap', marginLeft: '1rem' }}>{drink.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {drinks.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>No drinks configured</p>}
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