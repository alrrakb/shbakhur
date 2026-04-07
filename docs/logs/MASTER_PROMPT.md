# MASTER AUDIT & RESUME PROMPT

## Project: SH Bakhoor E-commerce (Arabic/RTL)

---

### CONTEXT

You are resuming work on an Arabic e-commerce project for luxury bakhoor/incense products. The theme is Black (#0a0a0a) and Gold (#D4AF37).

---

### FIRST PRIORITY: ProductCard Refactor

The ProductCard component was refactored to fix layout and hover issues. Verify and fix if needed:

**Card Structure (CRITICAL):**
```tsx
// Main card - MUST have h-full and flex flex-col
<motion.div className="... flex flex-col h-full">

  {/* Image Link - NOT containing the button */}
  <Link href={`/product/${slug}`} className="... relative overflow-hidden">
    <div className="relative aspect-square">
      <img ... />
      
      {/* Desktop hover button - centered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20">
        <button onClick={handleAddToCart}>إضافة للسلة</button>
      </div>
    </div>
  </Link>

  {/* Info Link - separate Link, NOT containing button */}
  <Link href={`/product/${slug}`} className="... flex-grow p-4">
    <h3>...</h3>
    {/* Short Description */}
    {product.short_description && <p className="text-zinc-400 text-sm line-clamp-2">...</p>}
    {/* Price/Rating - MUST have mt-auto to push to bottom */}
    <div className="... mt-auto">...</div>
  </Link>

  {/* Mobile button - always visible, NOT nested in Link */}
  <div className="lg:hidden">
    <button onClick={handleAddToCart}>إضافة للسلة</button>
  </div>
</motion.div>
```

**Key CSS Rules:**
- Card: `flex flex-col h-full`
- Info section: `flex-grow`
- Price/rating section: `mt-auto` (forces to bottom)
- Hover button: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20`

---

### DATABASE SCHEMA (Supabase)

Tables:
- `products`: id, title, slug, price, sale_price, image, short_description, description, is_active, is_featured, is_on_sale
- `categories`: id, name, slug, description, is_active
- `product_categories`: product_id, category_id (junction)
- `navigation_links`: name, link, has_dropdown, dropdown_items
- `seo_settings`: page_path, title, description, keywords
- `site_content`: section, key, value (JSON)
- `partners`: name, country, logo_url, is_active

---

### SPECIAL ROUTES

- `/products/best-sellers` → All active products
- `/products/best-offers` → Products where sale_price < price
- `/products/oud` → Products from categories with "بخور" or "عود" in slug
- `/products/[slug]` → Dynamic lookup from database categories

---

### KEY FILES TO CHECK

1. `src/components/ProductGrid.tsx` - Main product grid (contains ProductCard)
2. `src/components/ProductCard.tsx` - Standalone card component
3. `src/app/products/[category]/page.tsx` - Dynamic category pages
4. `src/lib/database.ts` - Database functions
5. `docs/logs/db_schema.md` - Full schema documentation
6. `docs/logs/project_progress.md` - Progress notes
7. `PROJECT_RULES.md` - Project conventions

---

### YOUR TASKS

1. **Verify ProductCard Layout**: Check that price/rating stays at bottom with mt-auto
2. **Verify Hover Button**: Check centered on desktop, visible on mobile
3. **Check Navigation**: Click image or info should go to product page
4. **Check Add to Cart**: Button click should NOT navigate (use e.stopPropagation())
5. **Build Test**: Run `npm run build` to verify no errors
6. **Audit DB vs UI**: Check if UI fields match database schema

---

### THEME REFERENCE

```css
bg-luxury-black = #0a0a0a
bg-luxury-dark = #1a1a1a
text-luxury-gold = #D4AF37
bg-luxury-gold = #D4AF37
```

---

### NOTE

If ProductCard has any issues, fix them first before proceeding to other tasks. The layout logic (flex-col h-full, flex-grow, mt-auto) is critical for consistent card heights.