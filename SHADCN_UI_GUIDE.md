# Shadcn UI & Theme System Guide

## Overview

This project uses **Shadcn UI** - a modern component library built on Radix UI and Tailwind CSS with a beautiful, customizable theme system featuring easy light/dark mode switching.

---

## 🎨 Modern 2026 Theme

### Color Palette

#### Light Theme
- **Primary**: Modern Blue/Indigo (`#4F6BFF`) - Vibrant, accessible
- **Success**: Modern Green - For positive actions
- **Warning**: Modern Amber - For cautions
- **Destructive**: Modern Red - For errors/deletions
- **Border Radius**: `0.75rem` - Softer, more modern curves

#### Dark Theme
- **Background**: Deep, rich dark (`#0A0C10`)
- **Primary**: Bright Blue/Indigo - High contrast
- **Smooth transitions**: 300ms color transitions on theme change
- **Improved scrollbar**: Custom styled scrollbars

### Design Philosophy (2026)
- **High contrast** for accessibility
- **Smooth animations** for modern feel
- **Vibrant colors** that pop in both themes
- **Softer borders** for contemporary look
- **System preference** detection built-in

---

## 🚀 Using Shadcn UI Components

### Installing New Components

**Always use the Shadcn CLI:**

```bash
# Install a single component
npx shadcn@latest add button

# Install multiple components
npx shadcn@latest add button card input label

# Install all components (not recommended)
npx shadcn@latest add
```

### Available Component Categories

#### Form Components
```bash
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group
npx shadcn@latest add switch
npx shadcn@latest add slider
```

#### Layout Components
```bash
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add tabs
npx shadcn@latest add accordion
npx shadcn@latest add collapsible
```

#### Feedback Components
```bash
npx shadcn@latest add alert
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add progress
npx shadcn@latest add skeleton
```

#### Navigation Components
```bash
npx shadcn@latest add navigation-menu
npx shadcn@latest add menubar
npx shadcn@latest add breadcrumb
npx shadcn@latest add pagination
```

#### Data Display
```bash
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add calendar
npx shadcn@latest add chart
```

#### Overlay Components
```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add context-menu
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add sheet
npx shadcn@latest add hover-card
```

---

## 🌗 Theme System

### Theme Toggle Component

Two variants available:

#### 1. Full Theme Toggle (with dropdown)
```tsx
import { ThemeToggle } from '@/components/theme-toggle'

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  )
}
```

Allows selection of:
- ☀️ Light
- 🌙 Dark
- 💻 System (auto-detect)

#### 2. Simple Theme Toggle
```tsx
import { ThemeToggleSimple } from '@/components/theme-toggle'

function Header() {
  return (
    <header>
      <ThemeToggleSimple />
    </header>
  )
}
```

Simple light/dark toggle button.

### Using Theme Programmatically

```tsx
"use client"

import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme()
  
  // Get current theme
  console.log(theme) // "light" | "dark" | "system"
  
  // Get resolved theme (what's actually shown)
  const currentTheme = theme === "system" ? systemTheme : theme
  
  // Change theme
  setTheme("dark")
  setTheme("light")
  setTheme("system")
  
  return <div>Current theme: {currentTheme}</div>
}
```

### Theme Configuration

Located in `/lib/providers.tsx`:

```tsx
<ThemeProvider
  attribute="class"           // Use class-based dark mode
  defaultTheme="system"       // Start with system preference
  enableSystem                // Allow system detection
  disableTransitionOnChange={false} // Smooth transitions
>
  {children}
</ThemeProvider>
```

---

## 📝 Component Usage Examples

### Button Variants

```tsx
import { Button } from "@/components/ui/button"

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

{/* Sizes */}
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔥</Button>
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Form with Validation

```tsx
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function MyForm() {
  const { register, handleSubmit } = useForm()
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </div>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  )
}
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description or content
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

---

## 🎯 AI Agent Rules

### When Building UI:

1. **Always use Shadcn CLI**
   ```bash
   npx shadcn@latest add [component-name]
   ```

2. **Never copy/paste components** from other projects

3. **Use theme-aware colors**
   ```tsx
   // ✅ Good - uses theme colors
   <div className="bg-background text-foreground">
   <Button variant="primary">Action</Button>
   
   // ❌ Bad - hardcoded colors
   <div className="bg-white text-black">
   <Button className="bg-blue-500">Action</Button>
   ```

4. **Include theme toggle** in layouts
   ```tsx
   import { ThemeToggle } from '@/components/theme-toggle'
   ```

5. **Test in both themes**
   - Always verify components work in light AND dark mode
   - Use theme-aware Tailwind classes

6. **Follow component patterns**
   - Use existing Shadcn components from `/components/ui`
   - Extend them in `/components/features` for custom needs
   - Don't modify `/components/ui` files directly

7. **Consistent spacing**
   ```tsx
   <div className="space-y-4">  {/* Vertical spacing */}
   <div className="space-x-4">  {/* Horizontal spacing */}
   <div className="gap-4">      {/* Grid/Flex gap */}
   ```

8. **Use semantic color classes**
   ```tsx
   <Badge variant="success">Success</Badge>
   <Badge variant="warning">Warning</Badge>
   <Badge variant="destructive">Error</Badge>
   ```

---

## 🛠️ Customizing Theme Colors

To customize the theme, edit `/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;     /* HSL format */
  --success: 142.1 76.2% 36.3%;
  --warning: 38 92% 50%;
  /* ... etc */
}

.dark {
  --primary: 217.2 91.2% 59.8%;
  /* ... etc */
}
```

**Format**: `H S% L%` (no commas, no hsl())

---

## 📦 Project Structure

```
/components
  ├── ui/                    # Shadcn components (from CLI)
  │   ├── button.tsx
  │   ├── card.tsx
  │   ├── input.tsx
  │   └── ...
  ├── theme-provider.tsx     # Theme context provider
  ├── theme-toggle.tsx       # Theme toggle components
  └── features/              # Custom feature components
      └── ...

/app
  └── globals.css            # Theme CSS variables

/lib
  ├── providers.tsx          # App providers (includes theme)
  └── utils.ts              # cn() utility for classes

tailwind.config.ts          # Tailwind config with theme colors
components.json             # Shadcn configuration
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Do This:

```tsx
// Hardcoded colors
<div className="bg-blue-500 text-white">

// Installing components manually
import { Button } from "shadcn-ui"

// Modifying ui components directly
// Edit /components/ui/button.tsx

// Theme without checking both modes
// Only test in light mode
```

### ✅ Do This Instead:

```tsx
// Use theme colors
<div className="bg-primary text-primary-foreground">

// Use Shadcn CLI
npx shadcn@latest add button

// Extend components in features folder
// Create /components/features/custom-button.tsx

// Test both themes
// Check light and dark mode
```

---

## 🔍 Troubleshooting

### Theme not switching?
- Ensure `ThemeProvider` is in `/lib/providers.tsx`
- Check that `darkMode: ["class"]` is in `tailwind.config.ts`
- Run `npm install` to ensure `next-themes` is installed

### Components not styled?
- Run `npx shadcn@latest add [component]` to install properly
- Check that component is imported from `@/components/ui`

### Colors look wrong?
- Verify CSS variables in `/app/globals.css`
- Check that you're using theme-aware classes
- Test in both light and dark modes

---

## 📚 Resources

- **Shadcn UI Docs**: https://ui.shadcn.com
- **Component Examples**: https://ui.shadcn.com/examples
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com
- **next-themes**: https://github.com/pacocoursey/next-themes

---

## ✅ Checklist for New Features

When building new UI features:

- [ ] Use Shadcn CLI to add components
- [ ] Test in both light and dark modes
- [ ] Use theme-aware color classes
- [ ] Include proper spacing (space-y, gap, etc.)
- [ ] Add theme toggle if needed
- [ ] Follow existing component patterns
- [ ] Document in feature README.md

---

**Modern, accessible, beautiful UI for 2026 and beyond.** 🎨
