# Database Schema - SH Bakhoor Project

## Products Table
```sql
products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text UNIQUE NOT NULL,
  price           text NOT NULL,
  sale_price      text,
  image           text,
  description     text,
  short_description text,
  is_active       boolean DEFAULT true,
  is_featured     boolean DEFAULT false,
  is_on_sale      boolean DEFAULT false,
  rating          numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

## Categories Table
```sql
categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  image_url       text,
  parent_id       uuid REFERENCES categories(id),
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)
```

## Product-Categories Junction Table
```sql
product_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
)
```

## Navigation Links Table
```sql
navigation_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  link            text NOT NULL,
  has_dropdown    boolean DEFAULT false,
  dropdown_items  jsonb DEFAULT '[]',
  sort_order      integer DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
)
```

## SEO Settings Table
```sql
seo_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path       text UNIQUE NOT NULL,
  title           text,
  description     text,
  keywords        text,
  og_image        text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
)
```

## Site Content Table
```sql
site_content (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section         text NOT NULL,
  key             text NOT NULL,
  value           jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(section, key)
)
```

## Partners Table
```sql
partners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  country         text,
  logo_url        text,
  is_active       boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)
```

## Featured Sections (hero, testimonials, etc.)
- Section titles, descriptions, icons, links stored in site_content as JSON
- Hero: title, subtitle, description, button text, button link, image
- Testimonials: name, location, rating, comment, is_active, sort_order
- News ticker messages stored in site_content

## Product Interface (TypeScript)
```typescript
interface Product {
  id: number | string;
  title: string;
  slug?: string;
  price: string;
  sale_price?: string;
  image: string;
  short_description?: string;
  description?: string;
  is_active: boolean;
  is_featured?: boolean;
  is_on_sale?: boolean;
  categories?: { id: number; name: string; slug: string }[];
}
```

## Category Interface (TypeScript)
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}
```