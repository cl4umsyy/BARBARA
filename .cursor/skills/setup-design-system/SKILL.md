---
name: setup-design-system
description: Configures BARBARA monochrome design system with Montserrat font, Tailwind CSS 4 theme tokens, and base UI components (Button, ProductCard). Use when styling pages, creating components, or establishing the visual foundation.
disable-model-invocation: true
---

# Setup Design System

Patuhi `.cursor/rules/design-system.mdc` saat implementasi.

## Workflow

```
Task Progress:
- [ ] Load Montserrat via next/font/google di layout.tsx
- [ ] Definisikan @theme tokens di globals.css (Tailwind 4)
- [ ] Buat komponen ui/Button.tsx
- [ ] Buat komponen product/ProductCard.tsx
- [ ] Terapkan grid 12 kolom, max-w-7xl, spacing kelipatan 8px
```

## Design Tokens

- Monochrome only: black `#000000`, dark `#1A1A1A`, body `#333333`, light `#F5F5F5`
- Semantic status only: green (success), red (error), amber (warning)
- Font: Montserrat — headings uppercase, buttons `tracking-[0.2em]`
- Buttons/inputs: `rounded-none`; inputs underlined (border-b only)
- Product images: aspect 3:4, `object-cover`; use `next/image` with `sizes`

## Component Checklist

- **Button**: primary (black bg → hover invert), secondary (outline → hover fill)
- **ProductCard**: NEW badge, hover scale/second image, IDR price format
- **Animations**: Framer Motion; hover `duration-300 ease-out`

## Code Templates

Layout, globals.css, Button, ProductCard: [reference.md](reference.md)
