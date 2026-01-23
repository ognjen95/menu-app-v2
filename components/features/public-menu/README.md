# Public Menu Feature

This feature provides the customer-facing QR menu experience that guests see when scanning a table QR code.

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
