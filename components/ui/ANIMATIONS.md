# Animation System Documentation

This project uses **Framer Motion** for smooth, performant animations throughout the application.

## Installation

```bash
npm install framer-motion
```

## Components

### Location
- `/components/ui/animated.tsx` - Reusable animation components and utilities
- `/tailwind.config.ts` - CSS animation utilities

## Usage

### 1. Framer Motion Components (Recommended for complex animations)

#### AnimatedDiv - Scroll-triggered animations
```tsx
import { AnimatedDiv } from '@/components/ui/animated'

<AnimatedDiv preset="fadeInUp" delay={0.2}>
  <Card>Content</Card>
</AnimatedDiv>
```

**Available Presets:**
- `fadeIn` - Simple fade in
- `fadeInUp` - Fade in from bottom
- `fadeInDown` - Fade in from top
- `fadeInLeft` - Fade in from left
- `fadeInRight` - Fade in from right
- `scaleIn` - Scale up with fade
- `scaleUp` - Scale from small to normal
- `slideInLeft/Right/Up/Down` - Slide animations
- `popIn` - Spring-based pop effect
- `bounceIn` - Bouncy entrance

**Props:**
- `preset` - Animation type (default: 'fadeIn')
- `delay` - Delay in seconds (default: 0)
- `duration` - Animation duration (default: 0.3s)
- `once` - Animate only once (default: true)
- `amount` - How much visible to trigger (0-1, default: 0.3)

#### AnimatedList & AnimatedListItem - Staggered animations
```tsx
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated'

<AnimatedList stagger="normal">
  {items.map(item => (
    <AnimatedListItem key={item.id} variant="scale">
      <Card>{item.name}</Card>
    </AnimatedListItem>
  ))}
</AnimatedList>
```

**Stagger speeds:** `fast` | `normal` | `slow`
**Variants:** `default` | `scale` | `fade`

#### Direct Motion Usage
```tsx
import { motion } from '@/components/ui/animated'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

#### Hover/Tap Animations
```tsx
import { motion } from '@/components/ui/animated'

<motion.div 
  whileHover={{ scale: 1.02 }} 
  whileTap={{ scale: 0.98 }}
>
  <Button>Click me</Button>
</motion.div>
```

**Prebuilt hover effects:**
```tsx
import { hoverScale, hoverScaleLarge, hoverLift } from '@/components/ui/animated'

<motion.div {...hoverScale}>
  <Card>Hover me</Card>
</motion.div>
```

### 2. Tailwind CSS Animations (For simple cases)

```tsx
<div className="animate-fade-in-up">
  Content fades in from bottom
</div>
```

**Available Classes:**
- `animate-fade-in` - Simple fade
- `animate-fade-in-up` - Fade from bottom
- `animate-fade-in-down` - Fade from top
- `animate-fade-in-left` - Fade from left
- `animate-fade-in-right` - Fade from right
- `animate-scale-in` - Scale with fade
- `animate-scale-up` - Scale from small
- `animate-slide-in-left/right/up/down` - Slide animations
- `animate-pop-in` - Pop effect
- `animate-bounce-in` - Bounce effect
- `animate-shimmer` - Shimmer loading effect

## Best Practices

1. **Use Framer Motion for:**
   - Interactive elements (hover, tap, drag)
   - Complex sequences
   - Scroll-triggered animations
   - Staggered lists
   - Layout animations

2. **Use Tailwind for:**
   - Simple one-time animations
   - Loading states
   - Static entrance animations

3. **Performance Tips:**
   - Use `transform` and `opacity` for best performance
   - Avoid animating `width`, `height`, `top`, `left`
   - Use `will-change` sparingly (already included in motion components)
   - Set `once={true}` for scroll animations to prevent re-triggering

4. **Accessibility:**
   - Respect `prefers-reduced-motion`
   - Keep animations subtle and purposeful
   - Don't rely on animation for critical information

## Examples from Menu Page

### Header Animation
```tsx
<motion.div 
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <PageHeader />
</motion.div>
```

### Button Hover
```tsx
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
  <Button>Add Item</Button>
</motion.div>
```

### Staggered Grid
```tsx
<motion.div 
  className="grid grid-cols-3 gap-4"
  initial="initial"
  animate="animate"
  variants={staggerContainer}
>
  {items.map((item, index) => (
    <motion.div key={item.id} variants={staggerItemScale}>
      <ItemCard item={item} />
    </motion.div>
  ))}
</motion.div>
```

### Sidebar Slide-in
```tsx
<motion.div 
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.4, delay: 0.1 }}
>
  <Sidebar />
</motion.div>
```

## Customization

### Create Custom Variants
```tsx
const customVariants = {
  initial: { opacity: 0, scale: 0.8, rotate: -10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring', stiffness: 300 }
  }
}

<motion.div variants={customVariants} initial="initial" animate="animate">
  Content
</motion.div>
```

### Extend Tailwind Animations
Add to `tailwind.config.ts`:
```ts
keyframes: {
  'my-animation': {
    '0%': { transform: 'translateY(0)' },
    '100%': { transform: 'translateY(-10px)' }
  }
},
animation: {
  'my-animation': 'my-animation 1s ease-in-out infinite'
}
```

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Animation Performance](https://web.dev/animations/)
- [Tailwind Animation Plugin](https://tailwindcss.com/docs/animation)
