# Feature Development Guidelines

## 🎯 Overview

This document outlines **mandatory requirements** for all feature development in this project. AI agents and developers MUST follow these rules.

---

## ✅ Required for Every Feature

### 1. Feature Documentation (MANDATORY)

Every feature subfolder MUST have a `README.md` file.

**Location:**
```
/components/features/[feature-name]/README.md
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
/components/features/[feature-name]/containers/component-name.test.tsx
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

## 📁 Feature Structure Template

```
/components/features/[feature-name]/
├── README.md                      # ✅ REQUIRED - Feature documentation
├── containers/
│   ├── feature-container.tsx      # Container component
│   └── feature-container.test.tsx # ✅ REQUIRED - Unit tests
└── components/
    ├── sub-component.tsx
    └── sub-component.test.tsx     # ✅ REQUIRED - Unit tests
```

---

## 📝 Feature Documentation Template

```markdown
# [Feature Name]

## Purpose
Brief description of what this feature does and why it exists.

## Components

### Container Components
- **`ComponentName`** - Description and responsibility
  - Location: `/components/features/[feature]/containers/component-name.tsx`
  - Purpose: What it handles

### UI Components
- **`UIComponentName`** - Description
  - Location: `/components/features/[feature]/components/component-name.tsx`
  - Purpose: What it displays

## Usage

\`\`\`tsx
import { ComponentName } from '@/components/features/[feature]/containers/component-name'

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
/components/features/auth/
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
/components/features/dashboard/
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
