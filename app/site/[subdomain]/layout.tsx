import { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { getWebsiteBySubdomain, DEFAULT_METADATA } from './utils'

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params
  const { tenant, website } = await getWebsiteBySubdomain(subdomain, true) // true = allow unpublished for metadata

  return {
    title: website?.seo_title || tenant.name || DEFAULT_METADATA.title,
    description: website?.seo_description || DEFAULT_METADATA.description,
    openGraph: website?.seo_image_url
      ? { images: [website.seo_image_url] }
      : DEFAULT_METADATA.openGraph,
    twitter: website?.seo_image_url
      ? { card: 'summary_large_image', images: [website.seo_image_url] }
      : DEFAULT_METADATA.twitter,
    icons: website?.favicon_url
      ? { icon: website.favicon_url }
      : DEFAULT_METADATA.icons,
  }
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  noStore()

  const { subdomain } = await params
  const { website } = await getWebsiteBySubdomain(subdomain, true) // Reuses cached result from metadata

  const fontHeading = website.font_heading || 'Inter'
  const fontBody = website.font_body || 'Inter'

  return (
    <>
      {/* Load custom fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${fontHeading.replace(' ', '+')}:wght@400;600;700&family=${fontBody.replace(' ', '+')}:wght@400;500&display=swap`}
        rel="stylesheet"
      />
      <div style={{
        backgroundColor: website.background_color || '#FFFFFF',
        color: website.foreground_color || '#18181B',
        fontFamily: fontBody,
        minHeight: '100vh',
      }}>
        {children}
      </div>
    </>
  )
}
