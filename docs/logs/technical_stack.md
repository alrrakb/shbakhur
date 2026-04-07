# Technical Stack - SH Bakhoor Project

## Core Framework
- **Next.js**: 16.x (App Router)
- **React**: 19.x
- **TypeScript**: 5.x

## UI & Styling
- **Tailwind CSS**: 3.x (custom config with luxury theme)
- **Framer Motion**: For animations
- **Google Fonts**: Cairo (Arabic)

## Database & Backend
- **Supabase**: PostgreSQL database
- **@supabase/supabase-js**: 2.x

## State Management
- React Context: CartContext, ToastContext

## Key Dependencies
- `next`: 16.2.2
- `react`: 19.x
- `react-dom`: 19.x
- `@supabase/supabase-js`: ^2.39.0
- `framer-motion`: ^11.x
- `tailwindcss`: ^3.4.0
- `@heroicons/react`: ^2.x

## File Structure
```
sh-bakhoor/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Homepage
│   │   ├── layout.tsx                  # Root layout with providers
│   │   ├── products/
│   │   │   ├── page.tsx                # All products
│   │   │   └── [category]/page.tsx     # Dynamic category pages
│   │   ├── product/[id]/page.tsx        # Product detail
│   │   ├── cart/page.tsx               # Cart
│   │   ├── checkout/page.tsx           # Checkout
│   │   ├── dashboard/                  # Admin dashboard
│   │   └── sitemap.ts                  # Sitemap
│   ├── components/
│   │   ├── Header.tsx                  # Navigation header
│   │   ├── Footer.tsx                  # Footer
│   │   ├── ProductGrid.tsx              # Product grid with sorting
│   │   ├── ProductCard.tsx             # Individual product card
│   │   ├── ProductSelection.tsx        # Category sections on home
│   │   ├── Hero.tsx                    # Hero section
│   │   ├── Partners.tsx                # Partners logo bar
│   │   ├── Testimonials.tsx            # Customer reviews
│   │   └── layout/                     # Layout components
│   ├── context/
│   │   ├── CartContext.tsx             # Cart state
│   │   └── ToastContext.tsx            # Notifications
│   ├── lib/
│   │   ├── supabase.ts                 # DB client
│   │   ├── database.ts                 # DB functions
│   │   └── seo.ts                      # SEO helpers
│   ├── data/
│   │   └── products.ts                 # Static product data
│   └── styles/
│       └── globals.css                 # Global styles + theme
├── tailwind.config.ts                   # Tailwind config
├── next.config.ts                      # Next config
├── package.json                        # Dependencies
└── docs/logs/                         # Documentation
    ├── db_schema.md
    ├── project_progress.md
    └── technical_stack.md
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Build & Run
- Development: `npm run dev`
- Production: `npm run build`
- Lint: `npm run lint`