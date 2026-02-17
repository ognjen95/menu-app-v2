# Feature Documentation & Testing Standards - Summary

## What Was Added

New **MANDATORY requirements** for all feature development to ensure code quality, maintainability, and proper documentation.

---

## 🎯 Three Critical Rules

### Rule 1: DDD Architecture (REQUIRED)
Every feature MUST follow Domain-Driven Design structure:
- **`types.ts`** - Domain types and entities
- **`services/`** - hooks.ts, actions.ts, queries.ts
- **`domain/`** - Business logic (when applicable)
- **`containers/`** - Smart components with logic
- **`components/`** - Dumb/presentational components

### Rule 2: Feature Documentation (README.md)
Every feature folder MUST have a `README.md` that:
- Explains what the feature does
- Lists all components
- Provides usage examples
- Documents props/API
- **MUST be updated** every time the feature is modified

### Rule 3: Unit Tests
Every feature component MUST have unit tests that:
- Test rendering, interactions, edge cases
- Are located adjacent to component files (`.test.tsx`)
- Use Jest + React Testing Library
- **MUST be updated** every time the component is modified

---

## 📁 Files Created

### 1. Documentation
- **`/FEATURE_GUIDELINES.md`** - Comprehensive guide for feature development
  - Detailed requirements
  - Templates and examples
  - Testing guidelines
  - Workflow instructions

- **`/features/auth/README.md`** - Example feature documentation
  - Shows proper documentation format
  - Real example for the auth feature

### 2. Testing Setup
- **`jest.config.js`** - Jest configuration for Next.js
- **`jest.setup.js`** - Jest setup with Testing Library
- **`package.json`** - Added testing dependencies and scripts

### 3. AI Agent Skills
Created skills for all agent folders so AI assistants know these rules:
- **`.agents/skills/feature-documentation-testing/SKILL.md`**
- **`.claude/skills/feature-documentation-testing/SKILL.md`**
- **`.windsurf/skills/feature-documentation-testing/SKILL.md`**

### 4. Memory Created
AI agents will automatically retrieve this rule from memory system

### 5. Updated Files
- **`README.md`** - Added "Development Standards" section
- **`package.json`** - Added test scripts and dependencies

---

## 🔧 Added Dependencies

### Testing Dependencies (in devDependencies):
```json
{
  "@testing-library/jest-dom": "^6.1.5",
  "@testing-library/react": "^14.1.2",
  "@testing-library/user-event": "^14.5.1",
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "jest-environment-jsdom": "^29.7.0"
}
```

### Test Scripts (in package.json):
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

## 🚀 What You Need to Do

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

### 3. Follow the Workflow
When creating or modifying features:

**Step 1:** Write/modify feature code  
**Step 2:** Create/update feature `README.md` ⚠️ **REQUIRED**  
**Step 3:** Create/update unit tests ⚠️ **REQUIRED**  
**Step 4:** Run tests and ensure they pass  
**Step 5:** Complete (all three must be done)

---

## 📊 Feature Structure Example (DDD)

```
/features/your-feature/
├── README.md                      ✅ REQUIRED - Feature documentation
├── types.ts                       ✅ REQUIRED - Domain types
│
├── domain/                        🔶 Business logic (when applicable)
│   ├── validators.ts              Pure validation functions
│   └── rules.ts                   Business rules
│
├── services/                      🔷 Application layer
│   ├── hooks.ts                   React Query hooks ('use client')
│   ├── actions.ts                 Server actions ('use server')
│   └── queries.ts                 Server-side queries (RSC)
│
├── containers/                    🟢 Smart components
│   ├── container.tsx              Orchestrates logic + state
│   └── container.test.tsx         ✅ REQUIRED - Container tests
│
└── components/                    🟢 Dumb components
    ├── component.tsx              Pure UI, props only
    └── component.test.tsx         ✅ REQUIRED - Component tests
```

### Layer Responsibilities

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Domain** | `domain/` | Pure business logic, validation, rules |
| **Application** | `services/` | Data fetching, mutations, orchestration |
| **Presentation** | `containers/` | State management, passes props |
| **Presentation** | `components/` | Pure rendering, no logic |

---

## ✅ Checklist for Feature Work

Before marking work as complete:

- [ ] **DDD Structure** - types.ts, services/, containers/, components/
- [ ] **Domain layer** - Business logic extracted (when applicable)
- [ ] **Services layer** - hooks.ts, actions.ts, queries.ts organized
- [ ] Feature code implemented/modified
- [ ] `README.md` exists in feature folder
- [ ] `README.md` is up to date
- [ ] All components have unit tests
- [ ] Tests cover functionality and edge cases
- [ ] All tests pass (`npm test`)
- [ ] Examples in README work

**Work is NOT complete until all items are checked.**

---

## 🤖 For AI Agents

These rules are now embedded in:
1. **Memory system** - Auto-retrieved when relevant
2. **Skill files** - Loaded for .agents, .claude, .windsurf
3. **Documentation** - Multiple reference docs
4. **README** - Visible in project overview

AI agents MUST:
- ✅ Follow DDD architecture (types, services, containers, components)
- ✅ Extract business logic to `domain/` when applicable
- ✅ Organize data fetching in `services/` (hooks, actions, queries)
- ✅ Create README.md for every feature
- ✅ Update README.md when modifying features
- ✅ Create tests for every component
- ✅ Update tests when modifying components
- ✅ Never skip documentation or tests
- ✅ Never claim work is complete without proper architecture, docs and tests

---

## 📚 Documentation References

- **`/FEATURE_GUIDELINES.md`** - Full guidelines
- **`/features/auth/README.md`** - Example
- **`/README.md`** - Project overview with standards
- **`.agents/skills/feature-documentation-testing/SKILL.md`** - AI agent skill

---

## 💡 Benefits

1. **Maintainability** - Clear documentation for all features
2. **Quality** - Tests catch bugs early
3. **Confidence** - Safe to refactor with test coverage
4. **Onboarding** - Easy for new team members and AI agents
5. **Living Docs** - Always up-to-date documentation

---

## ⚠️ Enforcement

These are **MANDATORY** requirements, not suggestions:
- Documentation is NOT optional
- Tests are NOT optional
- Updating docs/tests is NOT optional
- Work is NOT complete without docs and tests

---

**Code + Documentation + Tests = Complete Work**

This is the new standard for all feature development.

---

**Created:** January 2026  
**Status:** ✅ Active - All teams and AI agents must follow
