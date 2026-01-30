# Klopay.app SaaS - Architecture Documentation

## Overview

Klopay.app is a multi-tenant SaaS platform for restaurants and small businesses (car shops, hair salons, etc.) to create digital menus, manage orders, and build websites.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth
- **Payments**: Stripe (EU), Monri/Bank PSP (Serbia/Bosnia)
- **State Management**: TanStack React Query, React Hook Form
- **i18n**: Custom solution with DB-stored translations

## Multi-Tenant Architecture

```
Platform
├── Tenants (Restaurants/Businesses)
│   ├── Users (with roles)
│   ├── Locations
│   │   ├── Tables/Zones
│   │   └── QR Codes
│   ├── Menus
│   │   ├── Categories
│   │   ├── Items
│   │   │   ├── Variants
│   │   │   ├── Options/Extras
│   │   │   └── Allergens
│   │   └── Translations
│   ├── Inventory
│   ├── Orders
│   ├── Website (Builder)
│   └── Analytics
└── Platform Admin
    ├── Tenant Management
    ├── Billing (Stripe)
    └── Monitoring
```

## User Roles

| Role | Permissions |
|------|-------------|
| `platform_admin` | Full platform access, tenant management |
| `owner` | Full tenant access, billing, user management |
| `manager` | Menu, orders, staff management, analytics |
| `staff` | Basic order management |
| `kitchen` | Kitchen view, order status updates |
| `waiter` | Table service, order taking |
| `guest` | Public menu access, ordering |

## Subscription Plans

### Basic Plan ($19/month per venue)
- Manual translations only
- Limited themes (2)
- Basic analytics
- Klopay.app generation
- Order management
- 1 location included

### Pro Plan ($49/month per venue)
- AI-powered translations
- All themes and customization
- Advanced analytics
- Website builder (full)
- Inventory management
- Multiple locations
- Priority support

## Database Schema Overview

### Core Tables
- `tenants` - Restaurant/business entities
- `tenant_users` - Users belonging to tenants with roles
- `locations` - Physical locations per tenant
- `tables` - Tables/zones per location
- `qr_codes` - Generated QR codes

### Menu Tables
- `menus` - Menu definitions
- `categories` - Menu categories
- `menu_items` - Individual items
- `item_variants` - Size/flavor variants
- `item_options` - Extras and add-ons
- `allergens` - Allergen definitions
- `item_allergens` - Item-allergen mapping
- `dietary_tags` - Vegan, vegetarian, halal, etc.

### Inventory Tables
- `ingredients` - Stock items
- `item_ingredients` - Recipe mapping
- `stock_adjustments` - Stock history

### Order Tables
- `orders` - Order headers
- `order_items` - Order line items
- `order_payments` - Payment records

### Website Tables
- `websites` - Website configurations
- `website_pages` - Page definitions
- `website_blocks` - Block content
- `themes` - Theme definitions

### Translation Tables
- `languages` - Supported languages
- `tenant_languages` - Languages per tenant
- `translations` - Translated content

## API Structure

```
/api
├── /auth - Authentication endpoints
├── /tenants - Tenant CRUD
├── /locations - Location management
├── /menu - Menu management
├── /orders - Order processing
├── /payments - Payment handling
├── /website - Website builder
├── /admin - Platform admin
└── /public - Public menu access
```

## File Structure

```
/app
├── /(auth) - Authentication pages
├── /(public) - Public-facing pages
│   └── /[tenant-slug] - Tenant public pages
│       ├── /menu - Klopay.app
│       └── /order - Order flow
├── /dashboard - Restaurant dashboard
│   ├── /menu - Menu management
│   ├── /orders - Order management
│   ├── /tables - Table/QR management
│   ├── /inventory - Stock management
│   ├── /website - Website builder
│   ├── /analytics - Reports
│   └── /settings - Tenant settings
└── /admin - Platform admin
    ├── /tenants - Tenant management
    ├── /billing - Subscription management
    └── /monitoring - System health

/components
├── /features - Feature-specific components
│   ├── /menu - Menu components
│   ├── /orders - Order components
│   ├── /website-builder - Builder components
│   └── /analytics - Chart components
└── /ui - shadcn/ui components

/lib
├── /api - API utilities
├── /hooks - Custom React hooks
├── /utils - Helper functions
└── /validators - Zod schemas
```

## Security

- Row Level Security (RLS) on all tables
- Tenant isolation via `tenant_id` foreign key
- Role-based access control (RBAC)
- API rate limiting
- GDPR compliance with data export/deletion

## Performance

- CDN for images and static assets
- Database query optimization
- Caching for menu data
- Optimistic UI updates
- Code splitting and lazy loading
