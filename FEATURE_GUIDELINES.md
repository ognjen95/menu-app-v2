# Feature Development Guidelines

## 🎯 Overview

This document outlines **mandatory requirements** for all feature development in this project. AI agents and developers MUST follow these rules.

---

## ✅ Required for Every Feature

### 1. Feature Documentation (MANDATORY)

Every feature subfolder MUST have a `README.md` file.

**Location:**
```
/features/[feature-name]/README.md
```

**Required Content:**
- **Purpose** - What the feature does
- **Components List** - All containers and components in the feature
- **Usage Examples** - How to use the feature
- **Props/API** - Component interfaces and props
- **Dependencies** - External packages or internal dependencies
- **Notes** - Any important considerations

**When to Update:**
- ⚠️ **EVERY TIME** the feature is modified
- When adding new components
- When changing behavior or props
- When fixing bugs that affect usage
- When updating dependencies

### 2. Unit Tests (MANDATORY)

Every feature component MUST have unit tests.

**Location:**
```
/features/[feature-name]/containers/component-name.test.tsx
```

**Required Test Coverage:**
- ✅ Component renders correctly
- ✅ User interactions (clicks, form submissions)
- ✅ Props are handled correctly
- ✅ Edge cases (empty states, loading states)
- ✅ Error handling
- ✅ Integration with hooks/actions

**Testing Framework:**
- Jest + React Testing Library
- Located adjacent to component files

**When to Update:**
- ⚠️ **EVERY TIME** a feature component is modified
- When adding new functionality
- When fixing bugs
- When changing component behavior
- Before merging/committing changes

---

## 📋 Feature Development Workflow

### Step-by-Step Process:

1. **Develop Feature**
   - Create or modify feature components
   - Follow project structure and patterns

2. **Document Feature** (REQUIRED)
   - Update or create `README.md` in feature folder
   - Document all changes and new functionality
   - Include usage examples

3. **Write/Update Tests** (REQUIRED)
   - Write tests for new functionality
   - Update existing tests if behavior changed
   - Ensure all tests pass

4. **Verify**
   - Run tests: `npm test`
   - Ensure documentation is clear
   - Check that examples work

5. **Complete**
   - All three (code + docs + tests) must be done
   - Never skip documentation or tests

---

## 📁 Feature Structure Template (DDD Architecture)

```
/features/[feature-name]/
├── README.md                      # ✅ REQUIRED - Feature documentation
├── types.ts                       # ✅ REQUIRED - Domain types & entities
│
├── domain/                        # 🔶 DOMAIN LAYER (when applicable)
│   ├── validators.ts              # Business validation rules
│   └── rules.ts                   # Domain business logic
│
├── services/                      # 🔷 APPLICATION LAYER
│   ├── queries.ts                 # Server-side data fetching (RSC)
│   ├── actions.ts                 # Server actions ('use server')
│   └── hooks.ts                   # Client hooks (React Query)
│
├── containers/                    # 🟢 PRESENTATION LAYER - Smart components
│   ├── feature-container.tsx
│   └── feature-container.test.tsx # ✅ REQUIRED - Unit tests
│
└── components/                    # 🟢 PRESENTATION LAYER - Dumb components
    ├── sub-component.tsx
    └── sub-component.test.tsx     # ✅ REQUIRED - Unit tests
```

---

## 🏗️ Domain-Driven Design (DDD) Architecture

### Layer Responsibilities

| Layer | Folder | Responsibility | Framework |
|-------|--------|----------------|----------|
| **Domain** | `domain/` | Business rules, validation, pure logic | None (pure TS) |
| **Application** | `services/` | Orchestrates domain + infrastructure | React Query, Server Actions |
| **Presentation** | `containers/` | State coordination, passes props | React |
| **Presentation** | `components/` | Pure UI, receives props only | React |

### Domain Layer (`domain/`) - When Applicable

Use for features with complex business logic.

**Rules:**
- ✅ Pure functions, no side effects
- ✅ Framework agnostic (no React, no Next.js imports)
- ✅ Can be unit tested without mocking
- ✅ Contains validation, calculations, business rules

**Example - `domain/validators.ts`:**
```typescript
// Pure validation - no external dependencies
export function validateOrderTotal(items: OrderItem[]): ValidationResult {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (total <= 0) return { valid: false, error: 'Order must have positive total' }
  if (total > 10000) return { valid: false, error: 'Order exceeds maximum amount' }
  return { valid: true }
}

export function canCancelOrder(order: Order): boolean {
  return order.status !== 'completed' && order.status !== 'cancelled'
}
```

### Services Layer (`services/`)

Orchestrates data fetching and mutations.

**`services/queries.ts`** - Server-side data fetching for RSC:
```typescript
// Server Component queries
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function getOrders(locationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('orders').select('*').eq('location_id', locationId)
  return data
}
```

**`services/actions.ts`** - Server Actions:
```typescript
'use server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { validateOrderTotal } from '../domain/validators'

export async function createOrder(input: CreateOrderInput) {
  const validation = validateOrderTotal(input.items)
  if (!validation.valid) throw new Error(validation.error)
  
  const supabase = await createServerSupabaseClient()
  // ... create order
}
```

**`services/hooks.ts`** - Client-side React Query hooks:
```typescript
'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

export function useOrders(locationId: string) {
  return useQuery({
    queryKey: ['orders', locationId],
    queryFn: () => apiGet('/orders', { location_id: locationId }),
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (input) => apiPost('/orders', input),
  })
}
```

### Containers vs Components

**Containers (`containers/`)** - Smart components:
- Use hooks from `services/hooks.ts`
- Manage local UI state
- Pass data to components
- Handle user action callbacks

**Components (`components/`)** - Dumb/Presentational:
- Receive ALL data via props
- No data fetching
- No business logic
- Pure rendering
- Easy to test and reuse

### When to Use Domain Layer

✅ **Use `domain/` when:**
- Feature has complex validation rules
- Business logic that could change independently
- Calculations that need unit testing
- Rules shared across multiple components

❌ **Skip `domain/` when:**
- Simple CRUD without business rules
- Validation is trivial (e.g., required fields only)
- No complex calculations

### Migration for Existing Features

When modifying existing features:
1. Keep backward compatibility
2. Extract logic incrementally
3. Add `services/` folder for new code
4. Gradually move logic from containers to services
5. Document changes in README.md

---

## 📝 Feature Documentation Template

```markdown
# [Feature Name]

## Purpose
Brief description of what this feature does and why it exists.

## Components

### Container Components
- **`ComponentName`** - Description and responsibility
  - Location: `/features/[feature]/containers/component-name.tsx`
  - Purpose: What it handles

### UI Components
- **`UIComponentName`** - Description
  - Location: `/features/[feature]/components/component-name.tsx`
  - Purpose: What it displays

## Usage

\`\`\`tsx
import { ComponentName } from '@/features/[feature]/containers/component-name'

function Page() {
  return <ComponentName prop1="value" />
}
\`\`\`

## Props/API

### ComponentName Props
\`\`\`typescript
interface ComponentNameProps {
  prop1: string          // Description
  prop2?: number         // Optional prop description
  onAction: () => void   // Callback description
}
\`\`\`

## Architecture

### Domain Layer
- `domain/validators.ts` - Business validation rules
- `domain/rules.ts` - Business logic functions

### Services Layer
- `services/hooks.ts` - React Query hooks
- `services/actions.ts` - Server actions
- `services/queries.ts` - Server-side queries

## Dependencies
- `@tanstack/react-query` - For data fetching
- `react-hook-form` - For form management
- Internal: `/lib/some-utility`

## State Management
Describe any state management approach used.

## Testing
Location: `./containers/component-name.test.tsx`
- Covers: Rendering, interactions, edge cases

## Notes
- Important considerations
- Known limitations
- Future improvements
```

---

## 🧪 Testing Guidelines

### Test File Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ComponentName } from './component-name'

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render correctly', () => {
      render(<ComponentName />)
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle button click', () => {
      const handleClick = jest.fn()
      render(<ComponentName onClick={handleClick} />)
      
      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle loading state', () => {
      render(<ComponentName isLoading={true} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should handle error state', () => {
      render(<ComponentName error="Error message" />)
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })
})
```

### What to Test

✅ **Always Test:**
- Component renders without crashing
- Props are passed correctly
- User interactions trigger expected behavior
- Form submissions work correctly
- Error states display properly
- Loading states display properly
- Conditional rendering works

⚠️ **Don't Test:**
- Third-party library internals
- Next.js framework behavior
- Implementation details (internal state)

---

## 🚨 Enforcement Rules

### For AI Agents:

**YOU MUST:**
1. ✅ Create `README.md` for every new feature
2. ✅ Update `README.md` when modifying any feature
3. ✅ Create unit tests for every component
4. ✅ Update tests when modifying components
5. ✅ Run tests before completing work

**YOU MUST NOT:**
1. ❌ Skip documentation - it's NOT optional
2. ❌ Skip tests - they're NOT optional
3. ❌ Claim work is complete without docs and tests
4. ❌ Ignore existing docs/tests when modifying features

### Quality Standards

- **Documentation:** Clear, complete, with examples
- **Tests:** Meaningful coverage, not just 100% coverage
- **Both:** Updated together with code changes

---

## 🎓 Examples

### Example 1: Auth Feature

```
/features/auth/
├── README.md                              # Explains auth feature
├── containers/
│   ├── login-form.tsx                     # Login container
│   ├── login-form.test.tsx                # ✅ Login tests
│   ├── signup-form.tsx                    # Signup container
│   └── signup-form.test.tsx               # ✅ Signup tests
└── components/
    ├── email-input.tsx
    ├── email-input.test.tsx               # ✅ Email input tests
    ├── password-input.tsx
    └── password-input.test.tsx            # ✅ Password input tests
```

### Example 2: Dashboard Feature

```
/features/dashboard/
├── README.md                              # Explains dashboard feature
├── containers/
│   ├── dashboard-stats.tsx
│   ├── dashboard-stats.test.tsx           # ✅ Stats tests
│   ├── recent-activity.tsx
│   └── recent-activity.test.tsx           # ✅ Activity tests
└── components/
    ├── stat-card.tsx
    └── stat-card.test.tsx                 # ✅ Card tests
```

---

## 🔧 Setup Testing (If Not Already Done)

### Install Testing Dependencies

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

### Configure Jest

Create `jest.config.js`:
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
}

module.exports = createJestConfig(customJestConfig)
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom'
```

### Add Test Script to `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## 📊 Checklist for Feature Work

Before marking feature work as complete:

- [ ] Feature code is implemented
- [ ] **DDD Structure** - types.ts, services/, containers/, components/
- [ ] **Domain layer** - Extracted business logic (when applicable)
- [ ] **Services layer** - hooks.ts, actions.ts, queries.ts organized
- [ ] `README.md` exists in feature folder
- [ ] Documentation includes all required sections
- [ ] Usage examples are provided
- [ ] All components have unit tests
- [ ] Tests cover main functionality
- [ ] Tests cover edge cases
- [ ] All tests pass (`npm test`)
- [ ] Documentation is up to date with latest changes

---

## 💡 Benefits

### Why This Matters:

1. **Maintainability** - Easy to understand features later
2. **Onboarding** - New developers/AI agents understand quickly
3. **Quality** - Tests catch bugs before production
4. **Confidence** - Safe to refactor with test coverage
5. **Documentation** - Always up-to-date, living docs

---

## ❓ FAQ

**Q: Do I really need to document every feature?**  
A: Yes. Documentation is MANDATORY, not optional.

**Q: Can I skip tests for small changes?**  
A: No. Tests must be updated for ANY change.

**Q: What if the feature doesn't have a README yet?**  
A: CREATE it. Don't modify features without documentation.

**Q: What if tests are missing?**  
A: CREATE them. Don't modify features without tests.

**Q: How detailed should documentation be?**  
A: Detailed enough that someone unfamiliar can use the feature.

---

## 🎯 Remember

**Code + Documentation + Tests = Complete Work**

Never consider work "done" without all three components being updated.

---

**This is a mandatory requirement for all feature development.**
