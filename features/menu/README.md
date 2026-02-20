# Menu Feature Components

This folder contains components for managing menu items and their variants in the dashboard.

## Components

### VariantManager

A component for managing menu item variants within the item edit dialog.

#### Purpose
Allows restaurant owners to:
- Create variant categories (e.g., "Size", "Milk Type", "Extras")
- Add variants to each category (e.g., "Small", "Medium", "Large")
- Set price adjustments for each variant
- Mark variants as default or required
- Enable/disable variants

#### Props

```typescript
interface VariantManagerProps {
  menuItemId: string      // ID of the menu item to manage variants for
  menuItemName: string    // Name of the menu item (for display)
  basePrice: number       // Base price of the item (for reference)
  currency?: string       // Currency code (default: 'EUR')
}
```

#### Usage

```tsx
import { VariantManager } from '@/features/menu/VariantManager'

// Inside the item edit dialog
{editingItem && (
  <VariantManager
    menuItemId={editingItem.id}
    menuItemName={editingItem.name}
    basePrice={editingItem.base_price}
  />
)}
```

#### Features
- **Variant Categories**: Create categories like "Size", "Milk Type", etc.
  - Required: Customer must select an option
  - Allow Multiple: Customer can select multiple options
- **Variants**: Add options within each category
  - Price Adjustment: +/- amount from base price (0 = included)
  - Default: Pre-selected when viewing item
  - Available: Toggle visibility

## Database Schema

### variant_categories
- `id`: UUID (PK)
- `tenant_id`: UUID (FK to tenants)
- `name`: Text
- `description`: Text (nullable)
- `is_required`: Boolean (default: false)
- `allow_multiple`: Boolean (default: false)
- `sort_order`: Integer
- `is_active`: Boolean (default: true)
- `created_at`, `updated_at`: Timestamps

### menu_item_variants
- `id`: UUID (PK)
- `tenant_id`: UUID (FK to tenants)
- `menu_item_id`: UUID (FK to menu_items)
- `category_id`: UUID (FK to variant_categories)
- `name`: Text
- `price_adjustment`: Numeric(10,2) (default: 0)
- `is_default`: Boolean (default: false)
- `is_available`: Boolean (default: true)
- `sort_order`: Integer
- `created_at`, `updated_at`: Timestamps

## API Routes

### Variant Categories
- `GET /api/menu/variant-categories` - List all categories
- `POST /api/menu/variant-categories` - Create category
- `PATCH /api/menu/variant-categories/[categoryId]` - Update category
- `DELETE /api/menu/variant-categories/[categoryId]` - Delete category

### Menu Item Variants
- `GET /api/menu/items/[itemId]/variants` - List variants for item
- `POST /api/menu/items/[itemId]/variants` - Create variant
- `PATCH /api/menu/items/[itemId]/variants/[variantId]` - Update variant
- `DELETE /api/menu/items/[itemId]/variants/[variantId]` - Delete variant

## Translations

Translation keys are supported for:
- Variant category names: `variant_category.{id}.name`
- Variant category descriptions: `variant_category.{id}.description`
- Variant names: `menu_item_variant.{id}.name`

Use the helper functions from `@/lib/hooks/use-translations`:
- `generateVariantCategoryTranslationKey(categoryId, field)`
- `generateMenuItemVariantTranslationKey(variantId, field)`

## Dependencies
- `@tanstack/react-query` for data fetching
- `sonner` for toast notifications
- Shadcn UI components (Accordion, Dialog, Switch, etc.)
