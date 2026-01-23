# Database Schema Documentation

## Overview

This document describes the complete database schema for the QR Menu SaaS platform.

## Entity Relationship Diagram (Text)

```
tenants ─┬─ tenant_users ─── users (Supabase Auth)
         │
         ├─ locations ─── tables ─── qr_codes
         │
         ├─ menus ─── categories ─── menu_items ─┬─ item_variants
         │                                       ├─ item_options
         │                                       ├─ item_allergens
         │                                       └─ item_ingredients
         │
         ├─ orders ─── order_items ─── order_payments
         │
         ├─ websites ─── website_pages ─── website_blocks
         │
         └─ tenant_languages ─── translations
```

## Tables

### Core Tables

#### `tenants`
Main business entity (restaurant, shop, salon, etc.)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Business name |
| slug | text | URL-friendly identifier (unique) |
| type | enum | restaurant, shop, salon, other |
| logo_url | text | Logo image URL |
| description | text | Business description |
| email | text | Contact email |
| phone | text | Contact phone |
| timezone | text | e.g., "Europe/Belgrade" |
| default_currency | text | ISO currency code |
| country | text | ISO country code |
| vat_rate | decimal | VAT percentage |
| tax_id | text | Business tax ID |
| plan | enum | basic, pro |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Stripe subscription ID |
| subscription_status | enum | trialing, active, canceled, past_due |
| trial_ends_at | timestamp | Trial expiration |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update |

#### `tenant_users`
Users belonging to a tenant with their role

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| user_id | uuid | FK to auth.users |
| role | enum | owner, manager, staff, kitchen, waiter |
| is_active | boolean | Account active status |
| invited_at | timestamp | Invitation sent |
| joined_at | timestamp | When user accepted |
| created_at | timestamp | Creation timestamp |

### Location Tables

#### `locations`
Physical locations/branches

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| name | text | Location name |
| slug | text | URL-friendly identifier |
| address | text | Full address |
| city | text | City |
| postal_code | text | Postal code |
| country | text | Country code |
| latitude | decimal | GPS latitude |
| longitude | decimal | GPS longitude |
| phone | text | Location phone |
| email | text | Location email |
| is_active | boolean | Open for business |
| service_modes | jsonb | ["dine_in", "takeaway", "delivery"] |
| opening_hours | jsonb | Weekly schedule |
| created_at | timestamp | Creation timestamp |

#### `tables`
Tables/zones within a location

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| location_id | uuid | FK to locations |
| name | text | Table name (T1, Terrace A) |
| zone | text | Zone grouping |
| capacity | integer | Seating capacity |
| position_x | integer | Floor plan X position |
| position_y | integer | Floor plan Y position |
| is_active | boolean | Table available |
| created_at | timestamp | Creation timestamp |

#### `qr_codes`
Generated QR codes

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| location_id | uuid | FK to locations (optional) |
| table_id | uuid | FK to tables (optional) |
| code | text | Unique short code |
| type | enum | menu, table, location |
| url | text | Full URL |
| style | jsonb | QR customization |
| scans_count | integer | Scan counter |
| created_at | timestamp | Creation timestamp |

### Menu Tables

#### `menus`
Menu definitions (can have multiple per location)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| location_id | uuid | FK to locations (null = all) |
| name | text | Menu name |
| description | text | Menu description |
| is_active | boolean | Menu visible |
| available_from | time | Start time |
| available_until | time | End time |
| available_days | integer[] | Days of week (0-6) |
| sort_order | integer | Display order |
| created_at | timestamp | Creation timestamp |

#### `categories`
Menu categories

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| menu_id | uuid | FK to menus |
| tenant_id | uuid | FK to tenants |
| name_key | text | Translation key |
| description_key | text | Translation key |
| image_url | text | Category image |
| is_active | boolean | Category visible |
| sort_order | integer | Display order |
| created_at | timestamp | Creation timestamp |

#### `menu_items`
Individual menu items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| category_id | uuid | FK to categories |
| tenant_id | uuid | FK to tenants |
| name_key | text | Translation key |
| description_key | text | Translation key |
| base_price | decimal | Base price |
| compare_price | decimal | Original price (for discounts) |
| image_urls | text[] | Item images |
| is_active | boolean | Item available |
| is_featured | boolean | Show as featured |
| is_new | boolean | Mark as new |
| preparation_time | integer | Minutes to prepare |
| calories | integer | Calorie count |
| dietary_tags | text[] | vegan, vegetarian, halal, etc. |
| sort_order | integer | Display order |
| created_at | timestamp | Creation timestamp |

#### `item_variants`
Size/flavor variants

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| item_id | uuid | FK to menu_items |
| name_key | text | Translation key (Small, Large) |
| price_modifier | decimal | Price difference |
| is_default | boolean | Default selection |
| sort_order | integer | Display order |

#### `item_options`
Extras and add-ons (Glovo-style)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| item_id | uuid | FK to menu_items |
| group_name_key | text | Translation key (Toppings) |
| name_key | text | Translation key (Extra cheese) |
| price | decimal | Extra price |
| is_required | boolean | Must select one |
| max_selections | integer | Max selections in group |
| sort_order | integer | Display order |

#### `allergens`
Allergen definitions (global)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| code | text | gluten, nuts, lactose, etc. |
| name_key | text | Translation key |
| icon | text | Icon name |

#### `item_allergens`
Item-allergen mapping

| Column | Type | Description |
|--------|------|-------------|
| item_id | uuid | FK to menu_items |
| allergen_id | uuid | FK to allergens |

### Inventory Tables

#### `ingredients`
Stock items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| location_id | uuid | FK to locations (optional) |
| name | text | Ingredient name |
| unit | text | kg, l, pcs, etc. |
| current_stock | decimal | Current quantity |
| reorder_threshold | decimal | Low stock alert |
| cost_per_unit | decimal | Purchase cost |
| is_tracked | boolean | Track inventory |
| created_at | timestamp | Creation timestamp |

#### `item_ingredients`
Recipe mapping

| Column | Type | Description |
|--------|------|-------------|
| item_id | uuid | FK to menu_items |
| ingredient_id | uuid | FK to ingredients |
| quantity | decimal | Required quantity |

#### `stock_adjustments`
Stock change history

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| ingredient_id | uuid | FK to ingredients |
| user_id | uuid | FK to auth.users |
| quantity_change | decimal | +/- amount |
| reason | enum | purchase, sale, waste, adjustment |
| notes | text | Optional notes |
| created_at | timestamp | When adjusted |

### Order Tables

#### `orders`
Order headers

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| location_id | uuid | FK to locations |
| table_id | uuid | FK to tables (optional) |
| order_number | text | Display number (#001) |
| type | enum | dine_in, takeaway, delivery |
| status | enum | draft, placed, accepted, preparing, ready, served, completed, cancelled |
| customer_name | text | Customer name |
| customer_phone | text | Customer phone |
| customer_email | text | Customer email |
| customer_notes | text | Special instructions |
| subtotal | decimal | Before tax/tips |
| tax_amount | decimal | Tax |
| tip_amount | decimal | Tip |
| total | decimal | Final total |
| scheduled_for | timestamp | Pickup/delivery time |
| estimated_ready_at | timestamp | Estimated ready |
| accepted_at | timestamp | When accepted |
| ready_at | timestamp | When ready |
| completed_at | timestamp | When completed |
| created_at | timestamp | Creation timestamp |

#### `order_items`
Order line items

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | FK to orders |
| menu_item_id | uuid | FK to menu_items |
| variant_id | uuid | FK to item_variants |
| quantity | integer | Item quantity |
| unit_price | decimal | Price at order time |
| options | jsonb | Selected options |
| notes | text | Item-level notes |
| status | enum | pending, preparing, ready |

#### `order_payments`
Payment records

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | FK to orders |
| provider | enum | stripe, monri, cash, card_pos |
| status | enum | pending, paid, failed, refunded |
| amount | decimal | Payment amount |
| currency | text | ISO currency |
| provider_payment_id | text | External payment ID |
| provider_data | jsonb | Provider response |
| paid_at | timestamp | When paid |
| refunded_at | timestamp | When refunded |
| created_at | timestamp | Creation timestamp |

### Website Tables

#### `websites`
Website configurations

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| subdomain | text | subdomain.qrmenu.app |
| custom_domain | text | Custom domain |
| is_published | boolean | Site live |
| theme_id | uuid | FK to themes |
| primary_color | text | Brand color |
| secondary_color | text | Accent color |
| font_heading | text | Heading font |
| font_body | text | Body font |
| logo_url | text | Logo override |
| favicon_url | text | Favicon |
| seo_title_key | text | Translation key |
| seo_description_key | text | Translation key |
| created_at | timestamp | Creation timestamp |

#### `website_pages`
Page definitions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| website_id | uuid | FK to websites |
| slug | text | Page URL slug |
| title_key | text | Translation key |
| is_published | boolean | Page visible |
| sort_order | integer | Navigation order |
| created_at | timestamp | Creation timestamp |

#### `website_blocks`
Block content

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| page_id | uuid | FK to website_pages |
| type | enum | hero, gallery, menu_preview, about, testimonials, contact, hours, social |
| content | jsonb | Block data |
| settings | jsonb | Block styling |
| sort_order | integer | Display order |

#### `themes`
Theme definitions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Theme name |
| preview_url | text | Preview image |
| is_pro | boolean | Pro plan only |
| default_colors | jsonb | Color palette |
| default_fonts | jsonb | Font selections |
| created_at | timestamp | Creation timestamp |

### Translation Tables

#### `languages`
Supported languages

| Column | Type | Description |
|--------|------|-------------|
| code | text | Primary key (en, es, sr) |
| name | text | Language name |
| native_name | text | Native name |
| flag_emoji | text | 🇬🇧, 🇪🇸, 🇷🇸 |
| is_rtl | boolean | Right-to-left |

#### `tenant_languages`
Languages per tenant

| Column | Type | Description |
|--------|------|-------------|
| tenant_id | uuid | FK to tenants |
| language_code | text | FK to languages |
| is_default | boolean | Default language |
| is_enabled | boolean | Language active |

#### `translations`
Translated content

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tenant_id | uuid | FK to tenants |
| key | text | Translation key |
| language_code | text | FK to languages |
| value | text | Translated text |
| is_auto_translated | boolean | AI-generated |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update |

## Indexes

Key indexes for performance:
- `tenants.slug` - Unique index
- `tenant_users(tenant_id, user_id)` - Composite unique
- `locations(tenant_id, slug)` - Composite unique
- `orders(tenant_id, status)` - For dashboard queries
- `translations(tenant_id, key, language_code)` - Composite unique

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
1. Users can only access their tenant's data
2. Platform admins can access all data
3. Public endpoints for menu viewing
