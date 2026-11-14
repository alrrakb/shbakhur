# 🏗️ SH BAKHUR — System Architecture & Technical Blueprint

> **Application:** Luxury E-Commerce Platform for Oud & Fragrances  
> **Production Domain:** `shbakhur.com`  
> **Framework:** Next.js 16.2.2 (App Router) + React 19.2.4 + Tailwind CSS v4  

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    Client["العميل (Mobile / Desktop)"] --> Cloudflare["Cloudflare Edge WAF & Caching"]
    Cloudflare --> NextServer["Next.js 16 App Router (Turbopack)"]
    
    subgraph CoreEngine ["Core Engine Modules"]
        NextServer --> Storefront["المتجر العام (/ & /products & /product/[slug])"]
        NextServer --> CartCheckout["السلة والدفع الذكي (/cart & /checkout)"]
        NextServer --> AdminDash["لوحة الإدارة الشاملة (/dashboard)"]
    end

    subgraph DataAndIntegrations ["Data Layer & External APIs"]
        Storefront --> SupabaseDAL["Supabase PostgreSQL DAL (src/lib/database.ts)"]
        CartCheckout --> DirectPool["PostgreSQL Direct Connection Pool (db-engine.ts)"]
        AdminDash --> BolesaAPI["Bolesa Shipping API (بوليصة - Thermal AWB)"]
        AdminDash --> CloudflareAPI["Cloudflare Edge Cache Purge (src/lib/cloudflare.ts)"]
        CartCheckout --> Webhooks["Telegram & WhatsApp Instant Notifications"]
    end
```

---

## 2. Core Subsystems
1. **Storefront & Catalog:**
   - Multi-category Swiper sliders, responsive hero slider, dynamic trust features, live product search.
2. **Database Access Layer (DAL):**
   - Centralized queries in `src/lib/database.ts` managing `products`, `categories`, `orders`, `customers`, `discounts`, and `site_settings`.
3. **Logistics & Thermal Printing:**
   - Real-time AWB generation via Bolesa API (`src/app/api/shipping/bolesa/create`).
   - Dynamic tax invoice PDF generation (`InvoiceModal.tsx`) with barcode and QR.
4. **Immediate Milestone 2 Priorities:**
   - Direct digital payment gateway integration (Mada, Apple Pay, Visa, Tabby/Tamara).
   - Automated abandoned cart recovery via WhatsApp webhooks.
   - Meta Conversions API (CAPI) & TikTok Pixel tracking.
