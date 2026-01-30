# Public Menu Feature

This feature provides the customer-facing Klopay.app experience that guests see when scanning a table QR code.

## Components

### `public-menu-view.tsx`
The main public menu component that displays:
- Restaurant branding (logo, name)
- Category navigation
- Menu items with images, descriptions, prices
- Dietary filters (vegetarian, vegan, gluten-free, halal)
- Search functionality
- Shopping cart with add/remove items
- Item detail modal with variants and options

## Usage

```tsx
import { PublicMenuView } from '@/components/features/public-menu/public-menu-view'

<PublicMenuView
  tenant={tenant}
  menus={menus}
  locations={locations}
  allergens={allergens}
  website={website}
  tableId={tableId}
  locationId={locationId}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `tenant` | `Tenant` | Restaurant/business data |
| `menus` | `MenuWithCategories[]` | Menus with categories and items |
| `locations` | `Location[]` | Available locations |
| `allergens` | `Allergen[]` | Allergen definitions |
| `website` | `Website \| null` | Website customization |
| `tableId` | `string?` | Table ID from QR code |
| `locationId` | `string?` | Location ID from QR code |

## Features

1. **Category Navigation**
   - Horizontal scrollable tabs
   - "All" tab to show all items
   - Category-specific filtering

2. **Search**
   - Real-time search across item names and descriptions
   - Debounced for performance

3. **Dietary Filters**
   - Vegetarian, vegan, gluten-free, halal tags
   - Multiple filters can be combined

4. **Item Cards**
   - Image preview
   - Name, description, price
   - Dietary tags
   - Allergen count
   - "Add to order" button

5. **Item Detail Modal**
   - Full description
   - Variant selection (size)
   - Option groups (extras/add-ons)
   - Price calculation

6. **Shopping Cart**
   - Slide-out cart panel
   - Quantity adjustment
   - Item removal
   - Total calculation
   - Place order button

## Customization

The component uses the website's primary color when available, falling back to the default theme color.

## Dependencies

- `@/components/ui/button`
- `@/components/ui/badge`
- `@/components/ui/input`
- `lucide-react` icons
- `@/lib/utils` for `cn()` utility

---

## BlockRenderer Component

### `block-renderer.tsx`

Renders website builder blocks for the public site. Supports multiple block types with optional location data integration.

### Usage

```tsx
import { BlockRenderer, Location } from '@/components/features/public-menu/block-renderer'

<BlockRenderer
  block={block}
  theme={theme}
  menuItems={menuItemsMap}
  menuLink="/m/restaurant-slug"
  locations={locations}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `block` | `{ type: string; content: Record<string, unknown>; settings: Record<string, unknown> }` | Block data from website_blocks table |
| `theme` | `Theme` | Theme colors and fonts from website |
| `menuItems` | `Record<string, MenuItem>` | Menu items for menu_preview blocks |
| `menuLink` | `string` | Link to the public menu |
| `locations` | `Location[]` | (Optional) Locations from the tenant for location-aware blocks |

### Supported Block Types

- **hero** - Hero section with image, headline, CTA button
- **about** - About section with image and text
- **contact** - Contact info (supports locations)
- **hours** - Opening hours (supports locations)
- **location** - Map and address (supports locations)
- **gallery** - Image gallery
- **testimonials** - Customer testimonials
- **menu_preview** - Featured menu items
- **social** - Social media links
- **specials** - Daily specials
- **events** - Upcoming events
- **reservation** - Reservation CTA
- **features** - Feature icons grid
- **video** - YouTube/Vimeo embed
- **cta** - Call to action section
- **team** - Team members
- **text** - Rich text section
- **drinks** - Drinks menu

### Location-Aware Blocks

The `contact`, `hours`, and `location` blocks can pull data from the tenant's locations. Enable this via block content:

```json
{
  "use_locations": true,
  "location_mode": "all",        // or "selected"
  "location_ids": ["uuid1", "uuid2"]  // when mode is "selected"
}
```

#### Location Mode Options

| Mode | Description |
|------|-------------|
| `all` | Display all active locations |
| `selected` | Display only selected locations by ID |

When `use_locations` is false or no locations exist, blocks fall back to manual content fields (address, phone, email, hours_text, etc.).

### Location Interface

```typescript
interface Location {
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
```
