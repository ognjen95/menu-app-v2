# Landing Page Feature

Modern, animated landing page for Klopay.app marketing site.

## Components

| Component | Description |
|-----------|-------------|
| `header.tsx` | Sticky header with navigation and CTA |
| `hero-section.tsx` | Main hero with title, subtitle, CTAs, device mockups |
| `features-grid.tsx` | Bento grid layout showcasing features |
| `reimagined-section.tsx` | "Restaurant Reimagined" feature list |
| `website-builder-section.tsx` | Website builder feature showcase |
| `translations-section.tsx` | Themes & translations feature |
| `statistics-section.tsx` | Analytics & insights section |
| `ai-section.tsx` | AI features (coming soon) |
| `pricing-section.tsx` | Pricing cards |
| `testimonials-section.tsx` | Customer testimonials |
| `cta-section.tsx` | Final call-to-action |
| `footer.tsx` | Site footer |

## Usage

```tsx
import LandingPage from '@/app/page'
```

## Translations

All text content uses `next-intl` with translations in:
- `messages/public/en.json` (English)
- `messages/public/sr.json` (Serbian)
- `messages/public/es.json` (Spanish)

## Animations

Uses Framer Motion for:
- Scroll-based reveal animations
- Staggered text/card animations
- Hover effects on buttons and cards
- Parallax effects on mockups

## Dependencies

- `framer-motion` - Animations
- `next-intl` - Internationalization
- `lucide-react` - Icons
- Shadcn UI components
