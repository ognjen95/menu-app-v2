import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
  const { subdomain } = await params
  
  const { data: website } = await supabase
    .from('websites')
    .select('seo_title, seo_description, seo_image_url, favicon_url, tenant:tenants(name)')
    .eq('subdomain', subdomain)
    .single()

  const tenantName = (website?.tenant as { name?: string })?.name
  return {
    title: website?.seo_title || tenantName || 'Restaurant',
    description: website?.seo_description || '',
    openGraph: website?.seo_image_url ? {
      images: [website.seo_image_url],
    } : undefined,
    icons: website?.favicon_url ? {
      icon: website.favicon_url,
    } : undefined,
  }
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  noStore()
  
  const { subdomain } = await params

  const { data: website } = await supabase
    .from('websites')
    .select('font_heading, font_body, background_color, foreground_color')
    .eq('subdomain', subdomain)
    .single()

  if (!website) {
    notFound()
  }

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
