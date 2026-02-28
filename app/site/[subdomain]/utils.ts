/**
 * Public Website Utilities
 * 
 * This module handles fetching website data for public-facing tenant websites.
 * 
 * PREVIEW MODE (isPreview=true):
 * - Used by the dashboard website builder iframe to preview unpublished sites
 * - Uses service role client (supabaseAdmin) to bypass RLS policies
 * - RLS policy "Public can view published websites" blocks anon access to unpublished sites
 * - Preview URL format: /site/{subdomain}?preview=true
 * 
 * PUBLIC MODE (isPreview=false, default):
 * - Used for actual public website visitors
 * - Uses anon client (supabase) which respects RLS policies
 * - Only published websites (is_published=true) are accessible
 * 
 * @see preview.test.ts for comprehensive tests
 */
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Anon client for public access - respects RLS policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Service role client for preview mode - bypasses RLS to access unpublished websites
// SECURITY: This key is server-side only (not NEXT_PUBLIC_), never exposed to browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
// NOTE: Cache key includes isPreview, so layout(true) and page(false) create separate entries
export const getWebsiteBySubdomain = cache(async (subdomain: string, isPreview: boolean = false) => {
  console.log('[getWebsiteBySubdomain] subdomain:', subdomain, 'isPreview:', isPreview)
  
  // Use admin client for preview mode to bypass RLS (access unpublished websites)
  const client = isPreview ? supabaseAdmin : supabase
  
  const { data: tenant, error: tenantError } = await client
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', subdomain)
    .single()

  if (tenantError || !tenant) {
    console.log('[getWebsiteBySubdomain] Tenant not found:', subdomain)
    notFound()
  }

  let websiteQuery = client
    .from('websites')
    .select('*')
    .eq('tenant_id', tenant.id)

  // Only check is_published when not in preview mode (admin client bypasses RLS anyway)
  if (!isPreview) {
    websiteQuery = websiteQuery.eq('is_published', true)
  }

  const { data: website, error: websiteError } = await websiteQuery.single()

  if (websiteError || !website) {
    console.log('[getWebsiteBySubdomain] Website not found or not published. isPreview:', isPreview, 'error:', websiteError?.message)
    notFound()
  }

  console.log('[getWebsiteBySubdomain] Success - website.is_published:', website.is_published)
  return { tenant, website }
})

export { supabase }
