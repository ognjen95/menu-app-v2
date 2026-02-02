import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Public Supabase client (no auth required for public website)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Default Klopay metadata (fallback when tenant data is not set)
export const DEFAULT_METADATA = {
  title: 'Klopay - POS Light for Restaurants',
  description: 'Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.',
  openGraph: {
    type: 'website' as const,
    locale: 'en_US',
    siteName: 'Klopay.app',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'Klopay.app Logo',
    }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Klopay.app - POS Light for Restaurants',
    description: 'Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [{ url: '/logo.png' }],
    shortcut: ['/logo.png'],
  },
}

// Cached function to get website by subdomain - deduplicates across layout, page, and metadata
export const getWebsiteBySubdomain = cache(async (subdomain: string, isPreview: boolean = false) => {
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', subdomain)
    .single()

  if (tenantError || !tenant) {
    notFound()
  }

  let websiteQuery = supabase
    .from('websites')
    .select('*')
    .eq('tenant_id', tenant.id)

  // Only check is_published when not in preview mode
  if (!isPreview) {
    websiteQuery = websiteQuery.eq('is_published', true)
  }

  const { data: website, error: websiteError } = await websiteQuery.single()

  if (websiteError || !website) {
    notFound()
  }

  return { tenant, website }
})

export { supabase }
