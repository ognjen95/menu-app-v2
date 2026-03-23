import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { HERO_IMAGES, ABOUT_IMAGES, GALLERY_IMAGES, TEAM_IMAGES } from '@/lib/constants/default-images'
import { DEFAULT_LOCATION } from '@/lib/constants/website'

// =============================================================================
// Types
// =============================================================================

type BlockConfig = {
  type: string
  content: Record<string, unknown>
  settings: {
    padding: string
    background: string
    alignment: string
  }
}

// =============================================================================
// Default Onboarding Theme (Clean White/Black)
// =============================================================================

export const DEFAULT_ONBOARDING_THEME = {
  primary_color: '#18181B',
  secondary_color: '#F4F4F5',
  background_color: '#FFFFFF',
  foreground_color: '#18181B',
  accent_color: '#F97316',
  font_heading: 'Poppins',
  font_body: 'Inter',
} as const

// =============================================================================
// Default Block Settings
// =============================================================================

const DEFAULT_BLOCK_SETTINGS = {
  padding: 'medium',
  background: 'transparent',
  alignment: 'center',
} as const

// =============================================================================
// Page Block Configurations
// =============================================================================

const HOME_PAGE_BLOCKS: BlockConfig[] = [
  {
    type: 'hero',
    content: {
      headline: 'Welcome to Our Restaurant',
      subheadline: 'Experience the finest dining with us',
      button_text: 'View Menu',
      image_url: HERO_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, padding: 'large' },
  },
  {
    type: 'menu_preview',
    content: {
      title: 'Featured Items',
      item_ids: [],
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, background: 'secondary' },
  },
  {
    type: 'gallery',
    content: {
      title: 'Our Gallery',
      images: GALLERY_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS },
  },
  {
    type: 'features',
    content: {
      title: 'What We Offer',
      features: [
        { icon: 'wifi', title: 'Free WiFi', description: 'Stay connected while you dine' },
        { icon: 'parking', title: 'Parking', description: 'Convenient parking available' },
        { icon: 'accessible', title: 'Accessible', description: 'Wheelchair friendly' },
        { icon: 'outdoor', title: 'Outdoor Seating', description: 'Enjoy fresh air dining' },
      ],
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, background: 'secondary' },
  },
  {
    type: 'reservation',
    content: {
      title: 'Make a Reservation',
      subtitle: 'Book your table today',
      phone: '+1 (555) 000-0000',
      button_text: 'Book Now',
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, padding: 'large', background: 'primary' },
  },
  {
    type: 'contact',
    content: {
      title: 'Contact Us',
      address: 'Your Address Here',
      phone: '+1 (555) 000-0000',
      email: 'info@restaurant.com',
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, background: 'secondary' },
  },
]

const ABOUT_PAGE_BLOCKS: BlockConfig[] = [
  {
    type: 'hero',
    content: {
      headline: 'About Us',
      subheadline: 'Our story and passion for great food',
      button_text: '',
      image_url: HERO_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, padding: 'large' },
  },
  {
    type: 'about',
    content: {
      title: 'Our Story',
      text: 'Tell your story here. Share what makes your restaurant special and unique. Describe your passion for food, your commitment to quality, and the experience you want to create for your guests.',
      image_url: ABOUT_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, alignment: 'left' },
  },
  {
    type: 'gallery',
    content: {
      title: 'Inside Our Restaurant',
      images: GALLERY_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, background: 'secondary' },
  },
  {
    type: 'team',
    content: {
      title: 'Meet Our Team',
      members: [
        { name: 'Head Chef', role: 'Executive Chef', image_url: TEAM_IMAGES.chef },
      ],
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS },
  },
]

const CONTACT_PAGE_BLOCKS: BlockConfig[] = [
  {
    type: 'hero',
    content: {
      headline: 'Get In Touch',
      subheadline: 'We would love to hear from you',
      button_text: '',
      image_url: HERO_IMAGES.default,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, padding: 'large' },
  },
  {
    type: 'contact',
    content: {
      title: 'Contact Information',
      address: 'Your Address Here',
      phone: '+1 (555) 000-0000',
      email: 'info@restaurant.com',
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS },
  },
  {
    type: 'location',
    content: {
      title: 'Find Us',
      use_locations: false,
      show_address: true,
      address: DEFAULT_LOCATION.address,
      map_embed: DEFAULT_LOCATION.map_embed,
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS, background: 'secondary' },
  },
  {
    type: 'hours',
    content: {
      title: 'Opening Hours',
      hours_text: 'Monday - Friday: 11:00 AM - 10:00 PM\nSaturday - Sunday: 10:00 AM - 11:00 PM',
    },
    settings: { ...DEFAULT_BLOCK_SETTINGS },
  },
]

// =============================================================================
// Onboarding Website Result Types
// =============================================================================

export type OnboardingWebsiteResult = {
  success: boolean
  websiteId: string | null
  pages: { id: string; title: string; slug: string }[]
  blocksCreated: number
  errors: string[]
}

// =============================================================================
// Onboarding Website Service
// =============================================================================

export class OnboardingWebsiteService {
  private supabaseAdmin: SupabaseClient
  private tenantId: string
  private websiteId: string | null = null
  private errors: string[] = []

  constructor(tenantId: string) {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.tenantId = tenantId
  }

  async createDefaultWebsite(): Promise<OnboardingWebsiteResult> {
    const result: OnboardingWebsiteResult = {
      success: true,
      websiteId: null,
      pages: [],
      blocksCreated: 0,
      errors: [],
    }

    try {
      // Step 1: Get existing website (created during tenant creation)
      const { data: existingWebsite, error: websiteError } = await this.supabaseAdmin
        .from('websites')
        .select('id')
        .eq('tenant_id', this.tenantId)
        .single()

      if (websiteError || !existingWebsite) {
        this.errors.push(`Website not found: ${websiteError?.message || 'No website for tenant'}`)
        result.errors = this.errors
        result.success = false
        return result
      }

      this.websiteId = existingWebsite.id
      result.websiteId = this.websiteId

      // Step 2: Apply default theme to website
      const { error: themeError } = await this.supabaseAdmin
        .from('websites')
        .update(DEFAULT_ONBOARDING_THEME)
        .eq('id', this.websiteId)

      if (themeError) {
        this.errors.push(`Failed to apply theme: ${themeError.message}`)
      }

      // Step 3: Create pages
      const pagesConfig = [
        { title: 'Home', slug: 'home', blocks: HOME_PAGE_BLOCKS, sortOrder: 1 },
        { title: 'About', slug: 'about', blocks: ABOUT_PAGE_BLOCKS, sortOrder: 2 },
        { title: 'Contact', slug: 'contact', blocks: CONTACT_PAGE_BLOCKS, sortOrder: 3 },
      ]

      for (const pageConfig of pagesConfig) {
        const page = await this.createPage(pageConfig.title, pageConfig.slug, pageConfig.sortOrder)
        if (page) {
          result.pages.push({ id: page.id, title: page.title, slug: page.slug })
          
          // Step 4: Create blocks for each page
          const blocksCreated = await this.createBlocksForPage(page.id, pageConfig.blocks)
          result.blocksCreated += blocksCreated
        }
      }

      result.errors = this.errors
      result.success = this.errors.length === 0
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Onboarding website creation failed: ${errorMessage}`)
      result.success = false
    }

    return result
  }

  private async createPage(
    title: string,
    slug: string,
    sortOrder: number
  ): Promise<{ id: string; title: string; slug: string } | null> {
    if (!this.websiteId) return null

    const { data: page, error } = await this.supabaseAdmin
      .from('website_pages')
      .insert({
        tenant_id: this.tenantId,
        website_id: this.websiteId,
        title,
        slug,
        sort_order: sortOrder,
        is_published: true,
        is_in_navigation: true,
      })
      .select('id, title, slug')
      .single()

    if (error) {
      this.errors.push(`Failed to create page "${title}": ${error.message}`)
      return null
    }

    return page
  }

  private async createBlocksForPage(
    pageId: string,
    blocks: BlockConfig[]
  ): Promise<number> {
    let createdCount = 0

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      const { error } = await this.supabaseAdmin
        .from('website_blocks')
        .insert({
          tenant_id: this.tenantId,
          page_id: pageId,
          type: block.type,
          content: block.content,
          settings: block.settings,
          is_visible: true,
          sort_order: i + 1,
        })

      if (error) {
        this.errors.push(`Failed to create block "${block.type}": ${error.message}`)
      } else {
        createdCount++
      }
    }

    return createdCount
  }
}

// =============================================================================
// Convenience function for creating default website during onboarding
// =============================================================================

export async function createDefaultWebsiteForTenant(
  tenantId: string
): Promise<OnboardingWebsiteResult> {
  const service = new OnboardingWebsiteService(tenantId)
  return service.createDefaultWebsite()
}
