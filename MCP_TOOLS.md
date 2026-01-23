# MCP Tools & Capabilities

This document details the Model Context Protocol (MCP) servers available to AI agents working on this project.

## Overview

MCP servers provide AI agents with direct access to external services and APIs. This project has two MCP servers configured:

1. **Stripe MCP Server** - Stripe payment and billing operations
2. **Supabase MCP Server** - Database, auth, and backend operations

---

## 🔷 Stripe MCP Server

### Available Operations

#### Customer Management
- `mcp1_create_customer` - Create new Stripe customers
- `mcp1_list_customers` - List and search customers

#### Product & Pricing
- `mcp1_create_product` - Create products
- `mcp1_list_products` - List all products
- `mcp1_create_price` - Create pricing for products
- `mcp1_list_prices` - List all prices

#### Subscriptions
- `mcp1_list_subscriptions` - List subscriptions
- `mcp1_update_subscription` - Update subscription details
- `mcp1_cancel_subscription` - Cancel a subscription

#### Payments & Refunds
- `mcp1_list_payment_intents` - List payment intents
- `mcp1_create_refund` - Process refunds
- `mcp1_create_payment_link` - Generate payment links

#### Invoices
- `mcp1_create_invoice` - Create invoices
- `mcp1_create_invoice_item` - Add items to invoices
- `mcp1_finalize_invoice` - Finalize draft invoices
- `mcp1_list_invoices` - List invoices

#### Coupons & Promotions
- `mcp1_create_coupon` - Create discount coupons
- `mcp1_list_coupons` - List all coupons

#### Disputes
- `mcp1_list_disputes` - List payment disputes
- `mcp1_update_dispute` - Respond to disputes

#### Account
- `mcp1_retrieve_balance` - Get Stripe account balance

#### Documentation
- `mcp1_search_stripe_documentation` - Search Stripe docs for integration help

### When to Use Stripe MCP

**Use the Stripe MCP when:**
- Creating test data for development
- Setting up products and pricing
- Testing subscription flows
- Managing customer accounts
- Looking up payment or subscription information
- Searching for Stripe API documentation

**Don't use when:**
- Making changes to production data (use with caution)
- The operation can be done through the existing codebase (`/lib/stripe.ts`)

---

## 🔷 Supabase MCP Server

### Available Operations

#### Database Operations
- `mcp2_execute_sql` - Execute raw SQL queries (SELECT, INSERT, UPDATE, DELETE)
- `mcp2_list_tables` - List tables in schemas
- `mcp2_list_extensions` - List installed Postgres extensions

#### Migrations
- `mcp2_apply_migration` - Apply database migrations (DDL operations)
- `mcp2_list_migrations` - List all migrations

#### Edge Functions
- `mcp2_deploy_edge_function` - Deploy serverless functions
- `mcp2_list_edge_functions` - List deployed functions
- `mcp2_get_edge_function` - Get function source code

#### Project Management
- `mcp2_get_project_url` - Get API URL
- `mcp2_get_publishable_keys` - Get API keys
- `mcp2_generate_typescript_types` - Generate TypeScript types from schema

#### Branches (Development)
- `mcp2_create_branch` - Create development branches
- `mcp2_list_branches` - List all branches
- `mcp2_merge_branch` - Merge branch to production
- `mcp2_rebase_branch` - Rebase branch on production
- `mcp2_reset_branch` - Reset branch migrations
- `mcp2_delete_branch` - Delete a branch

#### Monitoring
- `mcp2_get_logs` - Get logs by service (api, postgres, auth, storage, etc.)
- `mcp2_get_advisors` - Get security and performance advisories

#### Documentation
- `mcp2_search_docs` - Search Supabase documentation

### When to Use Supabase MCP

**Use the Supabase MCP when:**
- Querying database tables for debugging
- Applying schema migrations
- Checking logs for errors
- Getting security advisories (especially after schema changes)
- Searching Supabase documentation
- Managing Edge Functions
- Generating TypeScript types

**Don't use when:**
- Making changes to production data (use with extreme caution)
- The operation should go through the application layer (`/lib/db.ts`)

---

## Best Practices for AI Agents

### 1. **Always Check Documentation First**
Use the documentation search tools before making assumptions:
```
mcp1_search_stripe_documentation(question="How to handle webhook signatures?")
mcp2_search_docs(query="{ searchDocs(query: \"RLS policies\") { nodes { title content } } }")
```

### 2. **Use Read-Only Operations When Possible**
- `list_*` operations are safe for information gathering
- `execute_sql` with SELECT is safe for querying
- `get_logs` for debugging

### 3. **Be Cautious with Mutations**
- Always verify the operation before running
- Use test/development environment
- Explain changes to the user before executing

### 4. **Leverage Existing Code First**
Before using MCP tools, check if the operation is already implemented in:
- `/lib/stripe.ts` - Stripe operations
- `/lib/db.ts` - Database queries
- `/app/auth/actions.ts` - Auth operations

### 5. **Use for Development & Debugging**
MCP tools are excellent for:
- Creating test data
- Debugging issues
- Exploring API capabilities
- Quick prototyping
- Documentation lookup

---

## Environment Awareness

### Current Setup
- **Stripe**: Using Stripe API keys from environment variables
- **Supabase**: Using Supabase project URL and keys from environment variables

### Data Safety
- All operations use the configured environment (dev/prod)
- Check `process.env.NODE_ENV` to know which environment you're in
- Production operations should always be confirmed with the user

---

## Example Use Cases

### Creating Test Stripe Data
```typescript
// AI agent can use MCP to quickly set up test data
mcp1_create_product({ name: "Premium Plan", description: "Premium features" })
mcp1_create_price({ product: "prod_xxx", unit_amount: 2999, currency: "usd" })
```

### Debugging Database Issues
```typescript
// Check table structure
mcp2_list_tables({ schemas: ["public"] })

// Query for specific data
mcp2_execute_sql({ query: "SELECT * FROM users_table WHERE email = 'test@example.com'" })

// Check for security issues
mcp2_get_advisors({ type: "security" })
```

### Looking Up Documentation
```typescript
// Find how to implement a feature
mcp1_search_stripe_documentation({ 
  question: "How to create a subscription with trial period?",
  language: "node"
})

mcp2_search_docs({ 
  graphql_query: "{ searchDocs(query: \"Row Level Security\") { nodes { title href content } } }"
})
```

---

## Security Considerations

1. **Never expose sensitive data** - API keys, secrets, or customer PII
2. **Verify before mutations** - Always confirm with user before modifying data
3. **Use appropriate environment** - Be clear about dev vs production
4. **Follow RLS policies** - Respect database security rules
5. **Audit trail** - Log important operations

---

## Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Stripe MCP Server](https://github.com/stripe/stripe-mcp-server)
- [Supabase MCP Server](https://github.com/supabase/mcp-server)
- [Project Stripe Integration](/lib/stripe.ts)
- [Project Database Layer](/lib/db.ts)

---

**Note for AI Agents:** These tools are powerful but should be used responsibly. Always prioritize existing application code, verify operations with the user, and be cautious with mutations. When in doubt, ask the user first!
