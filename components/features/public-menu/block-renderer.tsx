import { memo } from "react";
import { MapPin, Phone, Mail, Clock, Calendar, Sparkles, Wifi, ParkingCircle, Music, Dog, Baby, Accessibility, CreditCard, Utensils, Wine, Coffee, Leaf, Play, Building2 } from "lucide-react";
import { FaFacebookF, FaInstagram, FaXTwitter, FaTiktok, FaYoutube, FaLinkedinIn, FaYelp } from "react-icons/fa6";
import { SiTripadvisor } from "react-icons/si";
import { GalleryBlock } from "../GalleryBlock";
import Image from "next/image";
import Link from "next/link";
// Location type from database
export interface Location {
  id: string
  name: string
  slug: string
  address?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  opening_hours?: Record<string, { open: string; close: string; closed?: boolean }> | null
  is_active?: boolean
}

// Feature icons mapping
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

// Translation type
interface Translation {
  key: string
  language_code: string
  value: string
}

export const BlockRenderer = memo(function BlockRenderer({ block, theme, menuItems, menuLink, locations = [], t, translations = [], currentLanguage = 'en' }: {
  block: { id?: string; type: string; content: Record<string, unknown>; settings: Record<string, unknown> }
  theme: { primary: string; secondary: string; background: string; foreground: string; accent: string; fontHeading: string; fontBody: string }
  menuItems: Record<string, { id: string; name: string; description: string | null; base_price: number; image_urls: string[] | null }>
  menuLink: string
  locations?: Location[]
  t: (key: string) => string
  translations?: Translation[]
  currentLanguage?: string
}) {
  const content = block.content || {}

  // Helper to get translated text for this block
  const getTranslated = (field: string, fallback: string): string => {
    if (!block.id || !translations.length) return fallback
    const key = `website_block.${block.id}.${field}`
    const translation = translations.find(tr => tr.key === key && tr.language_code === currentLanguage)
    return translation?.value || fallback
  }

  // Helper to get locations based on block content settings
  const getBlockLocations = (): Location[] => {
    if (!content.use_locations) return []

    const mode = content.location_mode as string || 'all'
    const selectedIds = (content.location_ids as string[]) || []

    if (mode === 'selected' && selectedIds.length > 0) {
      return locations.filter(loc => selectedIds.includes(loc.id) && loc.is_active !== false)
    }
    return locations.filter(loc => loc.is_active !== false)
  }

  // Helper to format full address
  const formatAddress = (loc: Location): string => {
    const parts = [loc.address, loc.city, loc.postal_code, loc.country].filter(Boolean)
    return parts.join(', ')
  }

  // Helper to generate Google Maps embed URL from coordinates (uses free embed without API key)
  const getMapEmbedUrl = (loc: Location): string | null => {
    if (loc.latitude && loc.longitude) {
      // Use Google Maps embed without API key (limited but free)
      return `https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`
    }
    if (loc.address) {
      const query = encodeURIComponent(formatAddress(loc))
      return `https://maps.google.com/maps?q=${query}&z=15&output=embed`
    }
    return null
  }

  const sectionPadding = block.settings?.padding === 'large' ? '6rem 0' : '4rem 0'
  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
  }

  switch (block.type) {
    case 'hero':
      return (
        <section 
          className="animate-fade-in"
          style={{
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
          <div className="animate-fade-in-up animate-delay-200" style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
            <h1 style={{
              fontFamily: theme.fontHeading,
              fontSize: '3rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: content.image_url ? '#fff' : theme.foreground,
            }}>
              {getTranslated('headline', String(content.headline || t('welcome')))}
            </h1>
            {Boolean(content.subheadline) && (
              <p className="animate-fade-in-up animate-delay-300" style={{
                fontSize: '1.25rem',
                marginBottom: '2rem',
                color: content.image_url ? '#fff' : theme.foreground,
                opacity: 0.9,
              }}>
                {getTranslated('subheadline', String(content.subheadline))}
              </p>
            )}
            {Boolean(content.button_text) && (
              <a
                className="animate-scale-in animate-delay-400"
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
                {getTranslated('button_text', String(content.button_text))}
              </a>
            )}
          </div>
        </section>
      )

    case 'about':
      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding }}>
          <div style={{ ...contentStyle, display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {Boolean(content.image_url) && (
              <div className="animate-slide-in-left" style={{ flex: '1', minWidth: '300px', position: 'relative', aspectRatio: '16/10' }}>
                <Image
                  src={String(content.image_url)}
                  alt={getTranslated('title', String(content.title || t('aboutUs')))}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ borderRadius: '1rem' }}
                />
              </div>
            )}
            <div className="animate-slide-in-right animate-delay-200" style={{ flex: '1', minWidth: '300px' }}>
              <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
                {getTranslated('title', String(content.title || t('aboutUs')))}
              </h2>
              <p style={{ lineHeight: 1.8, opacity: 0.8 }}>
                {getTranslated('text', String(content.text || ''))}
              </p>
            </div>
          </div>
        </section>
      )

    case 'contact':
      const contactLocations = getBlockLocations()
      const useLocationsForContact = content.use_locations && contactLocations.length > 0

      // Single location contact card component
      const ContactCard = ({ loc, showName = false, index = 0 }: { loc: { name?: string; address?: string | null; phone?: string | null; email?: string | null }; showName?: boolean; index?: number }) => (
        <div 
          className="animate-fade-in-up"
          style={{
            backgroundColor: theme.background,
            padding: '1.5rem',
            borderRadius: '1rem',
            flex: '1',
            minWidth: '280px',
            maxWidth: contactLocations.length === 1 ? '500px' : undefined,
            animationDelay: `${index * 100}ms`,
          }}>
          {showName && loc.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Building2 size={20} color={theme.primary} />
              <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>{loc.name}</h3>
            </div>
          )}
          {loc.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <MapPin size={18} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.9rem' }}>{loc.address}</span>
            </div>
          )}
          {loc.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Phone size={18} color={theme.primary} />
              <a href={`tel:${loc.phone}`} style={{ color: theme.foreground, textDecoration: 'none', fontSize: '0.9rem' }}>
                {loc.phone}
              </a>
            </div>
          )}
          {loc.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color={theme.primary} />
              <a href={`mailto:${loc.email}`} style={{ color: theme.foreground, textDecoration: 'none', fontSize: '0.9rem' }}>
                {loc.email}
              </a>
            </div>
          )}
        </div>
      )

      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('contactUs')))}
            </h2>

            {useLocationsForContact ? (
              // Location-based contact info
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {contactLocations.map((loc, idx) => (
                  <ContactCard
                    key={loc.id}
                    loc={{ name: loc.name, address: formatAddress(loc), phone: loc.phone, email: loc.email }}
                    showName={contactLocations.length > 1}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              // Manual contact info (original behavior)
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {Boolean(content.address) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} color={theme.primary} />
                    <span>{getTranslated('address', String(content.address))}</span>
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
            )}
          </div>
        </section>
      )

    case 'hours':
      const hoursLocations = getBlockLocations()
      const useLocationsForHours = content.use_locations && hoursLocations.length > 0

      // Format opening hours from jsonb to readable text
      const formatOpeningHours = (hours: Record<string, { open: string; close: string; closed?: boolean }> | null | undefined): string => {
        if (!hours) return ''
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const dayLabels: Record<string, string> = {
          monday: t('days.mon'), tuesday: t('days.tue'), wednesday: t('days.wed'), thursday: t('days.thu'),
          friday: t('days.fri'), saturday: t('days.sat'), sunday: t('days.sun')
        }
        return days
          .map(day => {
            const h = hours[day]
            if (!h) return null
            if (h.closed) return `${dayLabels[day]}: ${t('closed')}`
            return `${dayLabels[day]}: ${h.open} - ${h.close}`
          })
          .filter(Boolean)
          .join('\n')
      }

      // Hours card component for a single location
      const HoursCard = ({ loc, showName = false }: { loc: Location; showName?: boolean }) => (
        <div style={{
          backgroundColor: theme.secondary,
          padding: '1.5rem',
          borderRadius: '1rem',
          flex: '1',
          minWidth: '260px',
          maxWidth: hoursLocations.length === 1 ? '400px' : undefined,
          textAlign: 'center',
        }}>
          {showName && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Building2 size={20} color={theme.primary} />
              <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>{loc.name}</h3>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '0.75rem' }}>
            <Clock size={20} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
            <pre style={{
              fontFamily: theme.fontBody,
              whiteSpace: 'pre-wrap',
              margin: 0,
              opacity: 0.8,
              textAlign: 'left',
              fontSize: '0.9rem',
            }}>
              {formatOpeningHours(loc.opening_hours)}
            </pre>
          </div>
        </div>
      )

      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {String(content.title || t('openingHours'))}
            </h2>

            {useLocationsForHours ? (
              // Location-based hours
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {hoursLocations.map(loc => (
                  <HoursCard key={loc.id} loc={loc} showName={hoursLocations.length > 1} />
                ))}
              </div>
            ) : (
              // Manual hours text (original behavior)
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
            )}
          </div>
        </section>
      )

    case 'gallery':
      const images = (content.images as string[]) || []
      return (
        <GalleryBlock
          images={images}
          title={String(content.title || t('gallery'))}
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
        <section className="animate-fade-in" style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('whatOurGuestsSay')))}
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              justifyContent: 'center',
            }}>
              {testimonials.map((testimonial, idx) => (
                <div 
                  key={idx} 
                  className="animate-scale-in"
                  style={{
                    backgroundColor: theme.background,
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    width: '320px',
                    flexShrink: 0,
                    animationDelay: `${idx * 100}ms`,
                  }}>
                  <p style={{ fontStyle: 'italic', marginBottom: '1rem', lineHeight: 1.6 }}>&ldquo;{getTranslated(`testimonial_${idx}_text`, testimonial.text)}&rdquo;</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {testimonial.image && (
                      <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p style={{ fontWeight: 600, margin: 0 }}>{getTranslated(`testimonial_${idx}_name`, testimonial.name)}</p>
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
        <section className="animate-fade-in" style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('featuredMenuItems')))}
            </h2>
            {selectedItems.length > 0 ? (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1.5rem',
                justifyContent: 'center',
              }}>
                {selectedItems.map((item, idx) => {
                  // Get translated menu item text
                  const getMenuItemTranslated = (field: 'name' | 'description', fallback: string | null): string => {
                    if (!translations.length || !fallback) return fallback || ''
                    const key = `menu_item.${item.id}.${field}`
                    const translation = translations.find(tr => tr.key === key && tr.language_code === currentLanguage)
                    return translation?.value || fallback
                  }

                  return (
                    <div 
                      key={item.id} 
                      className="animate-fade-in-up"
                      style={{
                        backgroundColor: theme.secondary,
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        width: '300px',
                        flexShrink: 0,
                        animationDelay: `${idx * 100}ms`,
                      }}>
                      {item.image_urls?.[0] && (
                        <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                          <Image
                            src={item.image_urls[0]}
                            alt={item.name}
                            fill
                            sizes="300px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>
                            {getMenuItemTranslated('name', item.name)}
                          </h3>
                          <span style={{ color: theme.primary, fontWeight: 600 }}>
                            ${item.base_price.toFixed(2)}
                          </span>
                        </div>
                        {item.description && (
                          <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>
                            {getMenuItemTranslated('description', item.description)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ opacity: 0.6, marginBottom: '0.5rem' }}>{t('noMenuItems')}</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.5, marginBottom: '1.5rem' }}>{t('noMenuItemsHint')}</p>
              </div>
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
              {getTranslated('title', String(content.title || t('followUs')))}
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
              <p style={{ opacity: 0.6 }}>{t('noSocialLinks')}</p>
            )}
          </div>
        </section>
      )


    case 'events':
      const events = (content.events as { title: string; date: string; time?: string; description?: string; image_url?: string }[]) || []
      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('upcomingEvents')))}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
              {events.map((event, idx) => (
                <div key={idx} className="animate-slide-in-right" style={{ display: 'flex', gap: '1.5rem', backgroundColor: theme.secondary, borderRadius: '1rem', overflow: 'hidden', flexWrap: 'wrap', maxWidth: '700px', width: '100%', animationDelay: `${idx * 150}ms` }}>
                  {event.image_url && (
                    <div style={{ width: '200px', height: '150px', position: 'relative', flexShrink: 0 }}>
                      <Image src={event.image_url} alt={event.title} fill sizes="200px" className="object-cover" />
                    </div>
                  )}
                  <div style={{ padding: '1.25rem', flex: 1, minWidth: '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Calendar size={16} color={theme.primary} />
                      <span style={{ fontSize: '0.875rem', color: theme.primary, fontWeight: 500 }}>{getTranslated(`event_${idx}_date`, event.date)}{event.time && ` • ${getTranslated(`event_${idx}_time`, event.time)}`}</span>
                    </div>
                    <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, fontSize: '1.25rem', margin: 0 }}>{getTranslated(`event_${idx}_title`, event.title)}</h3>
                    {event.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>{getTranslated(`event_${idx}_description`, event.description)}</p>}
                  </div>
                </div>
              ))}
            </div>
            {events.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noEvents')}</p>}
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
              {getTranslated('title', String(content.title || t('makeReservation')))}
            </h2>
            {Boolean(content.subtitle) && (
              <p style={{ fontSize: '1.125rem', color: '#fff', opacity: 0.9, marginBottom: '2rem' }}>{getTranslated('subtitle', String(content.subtitle))}</p>
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
                  {getTranslated('button_text', String(content.button_text || t('bookOnline')))}
                </a>
              )}
            </div>
          </div>
        </section>
      )

    case 'features':
      const features = (content.features as { icon: string; title: string; description?: string }[]) || []
      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('whatWeOffer')))}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
              {features.map((feature, idx) => {
                const IconComponent = FEATURE_ICONS[feature.icon] || Sparkles
                return (
                  <div key={idx} className="animate-scale-in" style={{ textAlign: 'center', padding: '1.5rem', backgroundColor: theme.background, borderRadius: '1rem', width: '180px', flexShrink: 0, animationDelay: `${idx * 80}ms` }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: `${theme.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <IconComponent size={28} color={theme.primary} />
                    </div>
                    <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>{getTranslated(`feature_${idx}_title`, feature.title)}</h3>
                    {feature.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: 0 }}>{getTranslated(`feature_${idx}_description`, feature.description)}</p>}
                  </div>
                )
              })}
            </div>
            {features.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noFeatures')}</p>}
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
                {getTranslated('title', String(content.title))}
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
                <p style={{ opacity: 0.6 }}>{t('noVideoUrl')}</p>
              </div>
            )}
          </div>
        </section>
      )

    case 'cta':
      const ctaHasImage = Boolean(content.background_image)
      const ctaTextColor = ctaHasImage ? '#fff' : theme.foreground
      return (
        <section 
          className="animate-fade-in"
          style={{
            padding: sectionPadding,
            backgroundColor: content.background_color ? String(content.background_color) : theme.background,
            backgroundImage: ctaHasImage ? `url(${content.background_image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            textAlign: 'center',
            position: 'relative',
          }}>
          {ctaHasImage && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />}
          <div style={{ ...contentStyle, position: 'relative', zIndex: 1 }}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', color: ctaTextColor, marginBottom: '1rem' }}>
              {getTranslated('title', String(content.title || t('readyToVisit')))}
            </h2>
            {Boolean(content.subtitle) && (
              <p style={{ fontSize: '1.125rem', color: ctaTextColor, opacity: 0.9, marginBottom: '2rem' }}>{getTranslated('subtitle', String(content.subtitle))}</p>
            )}
            {Boolean(content.button_text) && (
              <a href={String(content.button_url || menuLink)} style={{
                backgroundColor: ctaHasImage ? '#fff' : theme.primary,
                color: ctaHasImage ? theme.primary : '#fff',
                padding: '1rem 2.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-block',
              }}>
                {getTranslated('button_text', String(content.button_text))}
              </a>
            )}
          </div>
        </section>
      )

    case 'team':
      const members = (content.members as { name: string; role: string; image_url?: string; bio?: string }[]) || []
      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('meetOurTeam')))}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              {members.map((member, idx) => (
                <div key={idx} className="animate-fade-in-up" style={{ textAlign: 'center', width: '220px', flexShrink: 0, animationDelay: `${idx * 100}ms` }}>
                  {member.image_url ? (
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: `3px solid ${theme.primary}`, position: 'relative' }}>
                      <Image src={member.image_url} alt={member.name} fill sizes="150px" className="object-cover" />
                    </div>
                  ) : (
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', backgroundColor: theme.secondary, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem', opacity: 0.5 }}>{member.name.charAt(0)}</span>
                    </div>
                  )}
                  <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, marginBottom: '0.25rem' }}>{getTranslated(`member_${idx}_name`, member.name)}</h3>
                  <p style={{ color: theme.primary, fontSize: '0.875rem', fontWeight: 500 }}>{getTranslated(`member_${idx}_role`, member.role)}</p>
                  {member.bio && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.75rem' }}>{getTranslated(`member_${idx}_bio`, member.bio)}</p>}
                </div>
              ))}
            </div>
            {members.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noTeamMembers')}</p>}
          </div>
        </section>
      )

    case 'text':
      const textImageUrl = content.image_url as string | undefined
      const textImagePosition = (content.image_position as string) || 'top'
      const textAlignment = (content.alignment as 'left' | 'center' | 'right') || 'left'
      
      const TextContent = () => (
        <div style={{ textAlign: textAlignment, flex: 1, minWidth: '280px' }}>
          {Boolean(content.title) && (
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
              {getTranslated('title', String(content.title))}
            </h2>
          )}
          <div style={{ lineHeight: 1.8, opacity: 0.85, whiteSpace: 'pre-wrap' }}>
            {getTranslated('text', String(content.text || ''))}
          </div>
        </div>
      )
      
      const TextImage = () => (
        textImageUrl ? (
          <div style={{ width: '100%', position: 'relative', aspectRatio: '16/10' }}>
            <Image 
              src={textImageUrl} 
              alt="" 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              style={{ borderRadius: '0.5rem' }}
            />
          </div>
        ) : null
      )
      
      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding, backgroundColor: content.use_secondary_bg ? theme.secondary : 'transparent' }}>
          <div style={{ ...contentStyle }}>
            {textImagePosition === 'top' && textImageUrl && (
              <div className="animate-fade-in-up" style={{ marginBottom: '2rem', textAlign: textAlignment }}>
                <TextImage />
              </div>
            )}
            {(textImagePosition === 'left' || textImagePosition === 'right') && textImageUrl ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: textImagePosition === 'left' ? 'row' : 'row-reverse',
                gap: '3rem',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div className={textImagePosition === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'} style={{ flex: '1 1 50%', minWidth: '300px' }}>
                  <TextImage />
                </div>
                <div className={textImagePosition === 'left' ? 'animate-slide-in-right animate-delay-200' : 'animate-slide-in-left animate-delay-200'} style={{ flex: '1 1 40%', minWidth: '280px' }}>
                  <TextContent />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up"><TextContent /></div>
            )}
          </div>
        </section>
      )

    case 'location':
      const mapLocations = getBlockLocations()
      const useLocationsForMap = content.use_locations && mapLocations.length > 0

      // Display options (default to true if not set)
      const showMap = content.show_map !== false
      const showAddress = content.show_address !== false
      const showPhone = content.show_phone !== false
      const showDirections = content.show_directions !== false

      // Single location map card component
      const LocationMapCard = ({ loc, showName = false, isOnlyOne = false, index = 0 }: { loc: Location; showName?: boolean; isOnlyOne?: boolean; index?: number }) => {
        const mapUrl = content.map_embed ? String(content.map_embed) : getMapEmbedUrl(loc)
        const address = formatAddress(loc)

        return (
          <div 
            className="animate-fade-in-up"
            style={{
              backgroundColor: theme.background,
              borderRadius: '1rem',
              overflow: 'hidden',
              flex: isOnlyOne ? undefined : '1',
              minWidth: isOnlyOne ? undefined : '320px',
              width: isOnlyOne ? '100%' : undefined,
              animationDelay: `${index * 150}ms`,
            }}>
            {/* Map */}
            {showMap && mapUrl && (
              <div style={{ height: isOnlyOne ? '350px' : '220px', width: '100%' }}>
                <iframe
                  src={mapUrl}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
            {/* Info */}
            <div style={{ padding: '1.25rem' }}>
              {showName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Building2 size={20} color={theme.primary} />
                  <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>{loc.name}</h3>
                </div>
              )}
              {showAddress && address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <MapPin size={18} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{address}</p>
                </div>
              )}
              {showPhone && loc.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Phone size={18} color={theme.primary} />
                  <a href={`tel:${loc.phone}`} style={{ color: theme.foreground, textDecoration: 'none', fontSize: '0.9rem' }}>
                    {loc.phone}
                  </a>
                </div>
              )}
              {/* Directions link */}
              {showDirections && (loc.latitude && loc.longitude) && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    color: theme.primary,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  <MapPin size={16} />
                  {t('getDirections')}
                </a>
              )}
            </div>
          </div>
        )
      }

      return (
        <section className="animate-fade-in" style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
          <div style={contentStyle}>
            <h2 className="animate-fade-in-up" style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              {getTranslated('title', String(content.title || t('findUs')))}
            </h2>

            {useLocationsForMap ? (
              // Location-based maps
              mapLocations.length === 1 ? (
                // Single location - full width layout
                <LocationMapCard loc={mapLocations[0]} showName={false} isOnlyOne={true} index={0} />
              ) : (
                // Multiple locations - grid layout
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  {mapLocations.map((loc, idx) => (
                    <LocationMapCard key={loc.id} loc={loc} showName={true} isOnlyOne={false} index={idx} />
                  ))}
                </div>
              )
            ) : (
              // Manual location data (original behavior)
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '280px' }}>
                  {Boolean(content.image_url) && (
                    <div style={{ width: '100%', position: 'relative', aspectRatio: '16/10', marginBottom: '1.5rem' }}>
                      <Image src={String(content.image_url)} alt="Location" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" style={{ borderRadius: '1rem' }} />
                    </div>
                  )}
                  {showAddress && Boolean(content.address) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                      <MapPin size={20} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{getTranslated('address', String(content.address))}</p>
                    </div>
                  )}
                  {showPhone && Boolean(content.phone) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Phone size={20} color={theme.primary} style={{ flexShrink: 0 }} />
                      <a href={`tel:${content.phone}`} style={{ color: theme.foreground, textDecoration: 'none' }}>
                        {String(content.phone)}
                      </a>
                    </div>
                  )}
                  {showDirections && Boolean(content.directions) && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '1rem' }}>{getTranslated('directions', String(content.directions))}</p>
                  )}
                </div>
                {showMap && Boolean(content.map_embed) && (
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
            )}
          </div>
        </section>
      )

    // DUPLICATS OF MENU BLOCKS

    // case 'drinks':
    //   const drinks = (content.drinks as { name: string; description?: string; price: string; category?: string }[]) || []
    //   const drinkCategories = Array.from(new Set(drinks.map(d => d.category || t('drinks'))))
    //   return (
    //     <section style={{ padding: sectionPadding }}>
    //       <div style={contentStyle}>
    //         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
    //           <Wine size={32} color={theme.primary} style={{ margin: '0 auto 0.5rem' }} />
    //           <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem' }}>
    //             {getTranslated('title', String(content.title || t('drinksMenu')))}
    //           </h2>
    //         </div>
    //         {drinkCategories.map((category, catIdx) => (
    //           <div key={category} style={{ marginBottom: '2rem' }}>
    //             <h3 style={{ fontFamily: theme.fontHeading, fontSize: '1.25rem', color: theme.primary, marginBottom: '1rem', borderBottom: `2px solid ${theme.primary}`, paddingBottom: '0.5rem' }}>{category}</h3>
    //             <div style={{ display: 'grid', gap: '1rem' }}>
    //               {drinks.filter(d => (d.category || t('drinks')) === category).map((drink, idx) => (
    //                 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem', backgroundColor: theme.secondary, borderRadius: '0.5rem' }}>
    //                   <div>
    //                     <h4 style={{ fontWeight: 600, margin: 0 }}>{getTranslated(`drink_${idx}_name`, drink.name)}</h4>
    //                     {drink.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, margin: '0.25rem 0 0' }}>{getTranslated(`drink_${idx}_description`, drink.description)}</p>}
    //                   </div>
    //                   <span style={{ fontWeight: 600, color: theme.primary, whiteSpace: 'nowrap', marginLeft: '1rem' }}>{drink.price}</span>
    //                 </div>
    //               ))}
    //             </div>
    //           </div>
    //         ))}
    //         {drinks.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noDrinks')}</p>}
    //       </div>
    //     </section>
    //   )

    // case 'specials':
    //   const specials = (content.items as { name: string; description?: string; price?: string; day?: string; image_url?: string }[]) || []
    //   return (
    //     <section style={{ padding: sectionPadding, backgroundColor: theme.secondary }}>
    //       <div style={contentStyle}>
    //         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
    //           <Sparkles size={32} color={theme.primary} style={{ margin: '0 auto 0.5rem' }} />
    //           <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem' }}>
    //             {getTranslated('title', String(content.title || t('todaysSpecials')))}
    //           </h2>
    //           {Boolean(content.subtitle) && (
    //             <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>{getTranslated('subtitle', String(content.subtitle))}</p>
    //           )}
    //         </div>
    //         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
    //           {specials.map((item, idx) => (
    //             <div key={idx} style={{ backgroundColor: theme.background, borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '320px', flexShrink: 0 }}>
    //               {item.image_url && (
    //                 // eslint-disable-next-line @next/next/no-img-element
    //                 <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
    //               )}
    //               <div style={{ padding: '1.25rem' }}>
    //                 {item.day && <span style={{ fontSize: '0.75rem', color: theme.primary, fontWeight: 600, textTransform: 'uppercase' }}>{getTranslated(`special_${idx}_day`, item.day)}</span>}
    //                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.25rem' }}>
    //                   <h3 style={{ fontFamily: theme.fontHeading, fontWeight: 600, margin: 0 }}>{getTranslated(`special_${idx}_name`, item.name)}</h3>
    //                   {item.price && <span style={{ color: theme.primary, fontWeight: 700 }}>{item.price}</span>}
    //                 </div>
    //                 {item.description && <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem', margin: 0 }}>{getTranslated(`special_${idx}_description`, item.description)}</p>}
    //               </div>
    //             </div>
    //           ))}
    //         </div>
    //         {specials.length === 0 && <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('noSpecials')}</p>}
    //       </div>
    //     </section>
    //   )


    default:
      return (
        <section style={{ padding: sectionPadding }}>
          <div style={contentStyle}>
            <h2 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
              {getTranslated('title', String(content.title || ''))}
            </h2>
            <p>{getTranslated('text', String(content.text || ''))}</p>
          </div>
        </section>
      )
  }
})