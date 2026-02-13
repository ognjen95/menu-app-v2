import Link from 'next/link'
import { BlockRenderer } from '@/components/features/public-menu/block-renderer'
import type { Translation } from '@/lib/types'
import { supabase } from '../utils'

type Theme = {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
  fontHeading: string
  fontBody: string
}

type Location = {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  opening_hours: any
  is_active: boolean
}

interface WebsiteBlocksContentProps {
  pageId: string
  theme: Theme
  menuLink: string
  locations: Location[]
  translations: Translation[]
  currentLanguage: string
  tenantName: string
  t: (key: string) => string
}

export async function WebsiteBlocksContent({
  pageId,
  theme,
  menuLink,
  locations,
  translations,
  currentLanguage,
  tenantName,
  t,
}: WebsiteBlocksContentProps) {
  // Fetch blocks for current page
  const { data: blocks } = await supabase
    .from('website_blocks')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_visible', true)
    .order('sort_order')

  // Extract menu item IDs from menu_preview blocks
  const menuItemIds: string[] = []
  blocks?.forEach((block: any) => {
    if (block.type === 'menu_preview' && block.content?.item_ids) {
      menuItemIds.push(...(block.content.item_ids as string[]))
    }
  })

  // Fetch menu items if needed
  let menuItemsMap: Record<string, { id: string; name: string; description: string | null; base_price: number; image_urls: string[] | null }> = {}
  if (menuItemIds.length > 0) {
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, description, base_price, image_urls')
      .in('id', menuItemIds)

    if (menuItems) {
      menuItemsMap = menuItems.reduce((acc, item) => {
        acc[item.id] = item
        return acc
      }, {} as typeof menuItemsMap)
    }
  }

  // Render blocks or empty state
  if (!blocks || blocks.length === 0) {
    return (
      <div style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{ fontFamily: theme.fontHeading, fontSize: '2rem', marginBottom: '1rem' }}>
          Welcome to {tenantName}
        </h1>
        <p style={{ color: theme.foreground, opacity: 0.7 }}>
          This page is being set up. Check back soon!
        </p>
        <Link
          href={menuLink}
          style={{
            marginTop: '2rem',
            backgroundColor: theme.primary,
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          View Our Menu
        </Link>
      </div>
    )
  }

  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          theme={theme}
          menuItems={menuItemsMap}
          menuLink={menuLink}
          locations={locations}
          t={t}
          translations={translations}
          currentLanguage={currentLanguage}
        />
      ))}
    </>
  )
}
