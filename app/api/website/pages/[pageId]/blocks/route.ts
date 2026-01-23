import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ pageId: string }> }

// Default content for each block type
const DEFAULT_BLOCK_CONTENT: Record<string, Record<string, unknown>> = {
  hero: {
    headline: 'Welcome to Our Restaurant',
    subheadline: 'Experience the finest dining',
    button_text: 'View Menu',
    button_link: '/menu',
  },
  about: {
    title: 'Our Story',
    text: 'Share your restaurant\'s story here...',
  },
  gallery: {
    title: 'Gallery',
    images: [],
  },
  menu_preview: {
    title: 'Featured Items',
    show_prices: true,
    item_count: 6,
  },
  testimonials: {
    title: 'What Our Guests Say',
    testimonials: [],
  },
  contact: {
    title: 'Contact Us',
    address: '',
    phone: '',
    email: '',
  },
  hours: {
    title: 'Opening Hours',
    hours_text: 'Monday - Friday: 9am - 10pm\nSaturday - Sunday: 10am - 11pm',
  },
  social: {
    title: 'Follow Us',
  },
}

// GET - List blocks for a page
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { pageId } = await params

    // Verify page belongs to tenant's website
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      return { blocks: [] }
    }

    const { data: page } = await supabase
      .from('website_pages')
      .select('id')
      .eq('id', pageId)
      .eq('website_id', website.id)
      .single()

    if (!page) {
      throw new Error('Page not found')
    }

    const { data: blocks, error } = await supabase
      .from('website_blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { blocks: blocks || [] }
  })
}

// POST - Create new block
export async function POST(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { pageId } = await params

    const { type } = body as { type: string }

    if (!type) {
      throw new Error('Block type is required')
    }

    // Verify page belongs to tenant's website
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      throw new Error('Website not found')
    }

    const { data: page } = await supabase
      .from('website_pages')
      .select('id')
      .eq('id', pageId)
      .eq('website_id', website.id)
      .single()

    if (!page) {
      throw new Error('Page not found')
    }

    // Get max sort order
    const { data: lastBlock } = await supabase
      .from('website_blocks')
      .select('sort_order')
      .eq('page_id', pageId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (lastBlock?.sort_order || 0) + 1

    // Create block with default content
    const { data: block, error } = await supabase
      .from('website_blocks')
      .insert({
        tenant_id: tenantId,
        page_id: pageId,
        type,
        content: DEFAULT_BLOCK_CONTENT[type] || {},
        settings: {
          padding: 'normal',
          background: 'default',
          alignment: 'center',
        },
        is_visible: true,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { block }
  })
}
