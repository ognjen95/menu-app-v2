# QR Menu SaaS - Multi-Tenant Digital Menu Platform

A modern, multi-tenant SaaS platform for restaurants and small businesses to create digital menus, manage orders, and build websites.

## Features

### For Restaurant Owners
- **Digital Menu Management** - Create categories, items, variants, and extras
- **QR Code Generation** - Generate unique QR codes for tables and locations
- **Order Management** - Track orders from placement to completion
- **Inventory Tracking** - Monitor stock levels and get low-stock alerts
- **Analytics Dashboard** - Track revenue, orders, and popular items
- **Website Builder** - Create a simple website for your business
- **Multi-location Support** - Manage multiple locations from one dashboard

### For Customers
- **Scan & Order** - Scan QR code to view menu and place orders
- **Search & Filter** - Find items by name or dietary preferences
- **Allergen Information** - View allergens for each menu item
- **Cart & Checkout** - Add items to cart with customization options

### Subscription Plans
- **Basic Plan** (€5/month) - Menu management, orders, basic analytics
- **Pro Plan** (€15/month) - AI translations, advanced analytics, inventory, multiple locations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **State Management**: TanStack React Query

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (for payments)

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run database migrations (via Supabase dashboard or MCP)
```

### Project Structure

```
/app
├── api/              # API routes
├── dashboard/        # Restaurant dashboard
├── m/[slug]/         # Public menu pages
└── onboarding/       # New tenant setup

/components
├── features/         # Feature-specific components
└── ui/              # shadcn/ui components

/lib
├── api/             # API utilities
├── hooks/           # React Query hooks
└── types.ts         # TypeScript types

/docs
├── ARCHITECTURE.md  # System architecture
├── DATABASE_SCHEMA.md # Database documentation
└── PROGRESS.md      # Development progress
```

## Documentation

- [Architecture Overview](/docs/ARCHITECTURE.md)
- [Database Schema](/docs/DATABASE_SCHEMA.md)
- [Development Progress](/docs/PROGRESS.md)
- [Shadcn UI Guide](/SHADCN_UI_GUIDE.md)

---

# NextJs SaaS Starter Template

<img width="1122" alt="image" src="https://github.com/user-attachments/assets/63e761c4-aece-47c2-a320-f1cc18bf916b">

<img width="920" alt="image" src="https://github.com/user-attachments/assets/55384d22-cd09-46e4-b92d-e535b7d948fd">
<img width="1115" alt="image" src="https://github.com/user-attachments/assets/9ec724e6-d46f-4849-a790-efca329d1102">
<img width="1115" alt="image" src="https://github.com/user-attachments/assets/c5c1a61b-7ff3-49fd-9dea-8104026dd1e6">
<img width="1141" alt="image" src="https://github.com/user-attachments/assets/06559a5a-ca19-40bb-bf00-d3d2cbd94ee1">


This is the ultimate [Next.js](https://nextjs.org/) SAAS starter kit that includes a landing page, integrations with Supabase auth(Oauth, forget password, etc), PostgresDB with DrizzleORM and Stripe to collect payments, setup subscriptions and allow users to edit subscriptions/payment options.

- Full sign up/ sign in/ logout/ forget password/ password reset flow
- Oauth with Google and Github
- Utilize Stripe Pricing Table and Stripe Checkout to setup customer billing
- Integration with Stripe Customer Portal to allow users to manage billing settings
- Protected routes under /dashboard
- Drizzle ORM/Postgres integration
- Tailwind CSS/shadcn
- Stripe webhooks/ API hook to get customer current plan

## 🤖 AI Agent Tools (MCP Servers)

This project has Model Context Protocol (MCP) servers configured for AI coding assistants:

### Available MCP Servers:
- **Stripe MCP** - Direct Stripe API integration for managing customers, subscriptions, payments, and more
- **Supabase MCP** - Direct Supabase integration for database operations, auth, and more

### Capabilities:
AI agents can directly:
- Create and manage Stripe customers, products, prices, and subscriptions
- Query and modify Supabase database tables
- Execute SQL migrations
- Deploy Supabase Edge Functions
- Search Stripe and Supabase documentation

These tools are available to AI assistants like Claude, Windsurf, and others that support MCP.

## 📋 Development Standards

### Feature Documentation & Testing (MANDATORY)

All features MUST follow these requirements:

#### 1. Feature Documentation
- **Every feature folder** must have a `README.md` file
- Location: `/components/features/[feature-name]/README.md`
- **Must be updated** every time the feature is modified
- Includes: Purpose, components, usage examples, props/API, dependencies

#### 2. Unit Tests
- **Every feature component** must have unit tests
- Location: Adjacent to component (e.g., `component.test.tsx`)
- **Must be updated** every time a component is modified
- Framework: Jest + React Testing Library
- Coverage: Rendering, interactions, edge cases, error states

#### 3. Workflow
When working on features:
1. Develop/modify feature code
2. Update feature README.md ⚠️ **REQUIRED**
3. Update/create unit tests ⚠️ **REQUIRED**
4. Run tests and verify they pass
5. Only then is work considered complete

**📚 See `/FEATURE_GUIDELINES.md` for comprehensive documentation and testing guidelines.**

**Example:** `/components/features/auth/README.md`

## 🎨 Modern UI & Theme System

### Shadcn UI (2026)

This project uses **Shadcn UI** - a modern component library with:
- Beautiful, accessible components
- Easy light/dark mode switching
- Modern 2026 design system
- Built on Radix UI and Tailwind CSS

### Installing Components

**Always use the Shadcn CLI:**
```bash
npx shadcn@latest add button
npx shadcn@latest add card input label dialog
```

### Theme Features

- **🌗 Easy Theme Toggle** - Light/Dark/System modes
- **🎨 Modern Colors** - Vibrant 2026 color palette
- **✨ Smooth Transitions** - 300ms theme switching
- **📱 Responsive** - Works on all devices
- **♿ Accessible** - High contrast, WCAG compliant
- **🎯 Custom Scrollbars** - Styled for modern look

### Theme Toggle

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

<ThemeToggle />  // Dropdown: Light/Dark/System
```

### Available Theme Colors

Use theme-aware colors in your components:
- `bg-background` / `text-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-success` / `bg-warning` / `bg-destructive`
- `bg-card`, `bg-muted`, `bg-accent`, etc.

**📚 Complete Guide:** `/SHADCN_UI_GUIDE.md`

**⚠️ AI Agent Rules:** Always use Shadcn CLI, always use theme colors, always test both modes!

## Getting Started

As we will be setting up both dev and prod environments, simply use `.env.local` to develop locally and `.env` for production environments

### Setup Supabase
1. Create a new project on [Supabase](https://app.supabase.io/)
2. ADD `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your .env file
3. 
![image](https://github.com/user-attachments/assets/c8eb5236-96f1-4824-9998-3c54a4bcce12)
4. Add `NEXT_PUBLIC_WEBSITE_URL` to let Supabase know where to redirect the user after the Oauth flow(if using oauth).

#### Setup Google OAUTH Social Auth
You can easily set up social auth with this template. First navigate to google cloud and create a new project. All code is written. You just need to add the `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to your `.env` file.

1. Follow these [instructions](https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=environment&environment=server) to set up Google OAuth.

#### Setup Github OAUTH Social Auth
You can easily set up social auth with this template. First navigate to google cloud and create a new project. All code is written. You just need to add the `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET` to your `.env` file.

1. Follow these [instructions](https://supabase.com/docs/guides/auth/social-login/auth-github?queryGroups=environment&environment=server) to set up Github OAuth.

### Setup Postgres DB
You can use any Postgres db with this boilerplate code. Feel free to use [Vercel's Marketplace](https://vercel.com/marketplace) to browse through a collection of first-party services to add to your Vercel project.

Add `DATABASE_URL` to `.env` file e.g `postgresql://${USER}:${PASSWORD}@xxxx.us-east-2.aws.neon.tech/saas-template?sslmode=require`
### Setup OAuth with Social Providers

#### Setup redirect url
1. Go to Supabase dashboard
2. Go to Authentication > Url Configuration
3. Place production url into "Site URL".
<img width="1093" alt="image" src="https://github.com/user-attachments/assets/c10a5233-ad47-4005-b9ae-ad80fc626022">



### Setup Stripe

In order to collect payments and setup subscriptions for your users, we will be making use of [Stripe Checkout](https://stripe.com/payments/checkout) and [Stripe Pricing Tables](https://docs.stripe.com/payments/checkout/pricing-table) and [Stripe Webhooks](https://docs.stripe.com/webhooks)

1. [Register for Stripe](https://dashboard.stripe.com/register)
2. get your `STRIPE_SECRET_KEY` key and add it to `.env`. Stripe has both a Test and Production API key. Once you verify your business on Stripe, you will be able to get access to production mode in Stripe which would come with a production API key. But until then, we can use [Stripe's Test Mode](https://docs.stripe.com/test-mode) to build our app

![image](https://github.com/user-attachments/assets/01da4beb-ae1d-45df-9de8-ca5e2b2c3470)

4. Open up `stripeSetup.ts` and change your product information
5. run `npm run stripe:setup` to setup your Stripe product
6. [Create a new Pricing Table](https://dashboard.stripe.com/test/pricing-tables) and add your newly created products
7. When creating your new Pricing Table, set the *Confirmation Page* to *Don't show confirmation page*. Add [YOUR_PUBLIC_URL/subscribe/success](YOUR_PUBLIC_URL/subscribe/success) as the value(use [http://localhost:3000/subscribe/success](http://localhost:3000/subscribe/success) for local development). This will redirect the user to your main dashboard when they have completed their checkout. For prod, this will be your public url

![image](https://github.com/user-attachments/assets/af8e9dda-3297-4e04-baa0-de7eac2a1579)


8. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID` to `.env` 
![image](https://github.com/user-attachments/assets/3b1a53d3-d2d4-4523-9e0e-87b63d9108a8)

Your pricing table should now be set up

### Setup Database
This boilerplate uses Drizzle ORM to interact with a PostgresDb. 

Before we start, please ensure that you have `DATABASE_URL` set.

To create the necessary tables to start, run `npm run db:migrate`

#### To alter or add a table
1. navigate to `/utils/db/schema.ts`
2. Edit/add a table
3. run `npm run db:generate` to generate migration files
4. run `npm run db:migrate` to apply migration

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Setup Stripe for Local Development
To receive webhook events from Stripe while developing locally, follow these steps:

1. **Install the Stripe CLI**  
Download and install the [Stripe CLI](https://docs.stripe.com/stripe-cli) if you haven’t already. This tool allows your local server to receive webhook events from Stripe.

2. **Start the webhook listener**  
Run the following command to forward Stripe events to your local server:

```bash
npm run stripe:listen
```

This command starts the Stripe CLI in listening mode and forwards incoming webhook events to `http://localhost:3000/webhook/stripe`. 

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
