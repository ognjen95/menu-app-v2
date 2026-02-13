import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaXTwitter } from 'react-icons/fa6'

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  fontHeading: string
}

type SocialLinks = {
  facebook?: string
  instagram?: string
  twitter?: string
}

interface WebsiteFooterProps {
  tenantName: string
  seoDescription?: string
  socialLinks?: SocialLinks | null
  theme: Theme
}

export function WebsiteFooter({ tenantName, seoDescription, socialLinks, theme }: WebsiteFooterProps) {
  return (
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
            {seoDescription || 'Thank you for visiting our website.'}
          </p>
        </div>

        {socialLinks && Object.keys(socialLinks).length > 0 && (
          <div>
            <h4 style={{ fontFamily: theme.fontHeading, marginBottom: '1rem' }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
                  <FaFacebookF size={22} />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
                  <FaInstagram size={22} />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ color: theme.foreground }}>
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
        <p>© {new Date().getFullYear()} {tenantName}. <Link href="https://klopay.app">Powered by Klopay.app</Link></p>
      </div>
    </footer>
  )
}
