<div align="center">

# 🕌 SH Bakhoor — Luxury Incense & Perfume E-Commerce

### متجر SH للبخور والعطور الفاخرة

A full-stack, **RTL-first** e-commerce platform for a luxury Arabic incense (bakhoor), oud &amp; perfume store — complete with a **realtime admin dashboard**, CMS, invoicing, and printable shipping labels.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p>
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" />
  <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" />
  <img alt="Status" src="https://img.shields.io/badge/status-active-success.svg?style=flat-square" />
</p>

</div>

---

## 🚀 Overview

**SH Bakhoor** is a production-grade online store built for a Saudi luxury incense &amp; perfume brand. It goes far beyond a static shopfront: it is a complete commerce system that pairs a polished, animated, **right-to-left (Arabic)** customer experience with a powerful, **realtime** admin back office.

The project solves a common problem for small-to-mid retailers: the need for a **single, self-hosted platform** that handles the entire order lifecycle — from browsing and cart, through checkout (Cash on Delivery **and** bank transfer), to order fulfillment, invoicing, and shipping — without stitching together multiple SaaS tools. Store owners manage everything (content, products, categories, discounts, SEO, delivery fees) from a built-in dashboard, and get instant **Telegram notifications** the moment an order lands.

> **Objective:** Deliver a fast, maintainable, fully-typed commerce platform where a non-technical store owner controls 100% of the storefront content and operations from the browser.

---

## ✨ Key Features

### 🛍️ Storefront (Customer-facing)
- **RTL-first, fully Arabic UI** with smooth Framer Motion animations
- Hero slider, category showcase, best-sellers, and dynamic product grids
- Live product search with instant results
- Shopping cart with discount-code support (persistent via React Context)
- Two-step checkout: **Cash on Delivery** &amp; **Bank Transfer** (with receipt upload)
- **Configurable delivery fee** applied automatically to every order

### 🧑‍💼 Admin Dashboard
- **Realtime orders board** (Supabase Realtime) — new orders flash in live, with unread tracking
- Order lifecycle management: status flow, detail drawer, bulk actions, test-order cleanup
- Manual order creation &amp; full order editing
- Full **products CRUD** with image upload and rich-text descriptions
- **Category management** with hierarchical parent/child navigation dropdowns
- **Discounts**, **customers**, and **SEO** management modules
- **Headless CMS**: control every homepage section (hero, categories, testimonials, partners, footer, news ticker, branding) from one screen

### 🧾 Fulfillment &amp; Operations
- Auto-generated **A4 PDF invoices** (html2canvas + jsPDF)
- Printable **shipping labels** with **CODE128 barcodes** (JsBarcode), sized for thermal label paper
- **Telegram & WhatsApp order notifications** to one or multiple recipients
- **WooCommerce / WordPress import** endpoints for data migration

### 🔐 Platform
- Supabase **SSR authentication** with middleware-protected dashboard routes
- End-to-end **TypeScript** with typed data-access layer
- On-demand **ISR revalidation** so content edits appear instantly on the live store

---

## 💻 Tech Stack

| Category | Technologies |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Middleware) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Icons &amp; Carousels** | [Lucide React](https://lucide.dev/), [Swiper](https://swiperjs.com/) |
| **Backend / DB** | [Supabase](https://supabase.com/) — PostgreSQL, Auth, Storage, Realtime |
| **SSR Auth** | [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side) |
| **Documents** | [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [JsBarcode](https://github.com/lindell/JsBarcode) |
| **Integrations** | Telegram Bot API, WhatsApp API (CallMeBot / Gateway / Meta Cloud) |
| **Migration Tooling** | [`pg`](https://node-postgres.com/), [`mysql2`](https://github.com/sidorares/node-mysql2) (WooCommerce import) |
| **Tooling** | ESLint 9, PostCSS, `nextjs-toploader` |

---

## 📂 Folder Structure

```
sh-bakhoor/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (storefront)/         # Home, products, product/[slug], cart, about, faq
│   │   ├── checkout/             # Checkout, bank-transfer payment, success
│   │   ├── dashboard/            # Admin: orders, products, categories,
│   │   │                         #        discounts, customers, content (CMS), seo
│   │   ├── api/                  # notify-telegram, products, import-wp, import-wp-gallery
│   │   ├── actions/              # Server Actions (e.g. revalidate)
│   │   └── login/                # Auth entry
│   ├── components/               # Header, Footer, Hero, ProductCard, InvoiceTemplate,
│   │   │                         # ShippingLabelTemplate, InvoiceModal, ...
│   │   └── layout/               # Breadcrumb, PageHeader
│   ├── context/                  # CartContext, ToastContext
│   ├── lib/                      # database, supabase, auth, seo, storage, import/export utils
│   ├── types/                    # Shared TypeScript types
│   └── middleware.ts             # Dashboard auth guard
├── public/                       # Static assets
├── next.config.ts
├── tailwind.config / postcss.config.mjs
└── tsconfig.json
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** (or yarn / pnpm)
- A **Supabase** project (PostgreSQL database + Storage bucket)
- *(Optional)* A **Telegram bot** token for order notifications

### 1. Clone &amp; Install
```bash
git clone https://github.com/alrrakb/shbakhur.git
cd shbakhur
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```bash
# ── Supabase ────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_Service_role_key=<your-service-role-key>   # server-side only
DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/postgres

# ── Telegram order notifications (optional) ─
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<chat-id-1>,<chat-id-2>            # comma-separated for multiple recipients

# ── WhatsApp order notifications (optional) ─
# Option 1: CallMeBot (Free, zero-setup, no Meta verification)
WHATSAPP_PHONE=<phone-with-country-code>            # e.g. +966501234567
WHATSAPP_APIKEY=<callmebot-api-key>

# Option 2: Gateway / UltraMsg / Green-API
# WHATSAPP_GATEWAY_URL=https://api.ultramsg.com/instanceXXXX/messages/chat
# WHATSAPP_GATEWAY_TOKEN=<token>

# Option 3: Meta WhatsApp Cloud API
# WHATSAPP_CLOUD_API_TOKEN=<access-token>
# WHATSAPP_CLOUD_PHONE_NUMBER_ID=<phone-number-id>

```

> 🔒 Never commit `.env`. Keep the service-role key server-side only.

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** for the storefront, and **[/dashboard](http://localhost:3000/dashboard)** for the admin panel (redirects to `/login` if unauthenticated).

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📸 Previews / Screenshots

> _Replace the placeholders below with real screenshots or GIFs._

| Storefront | Product Page |
| :---: | :---: |
| ![Storefront](https://via.placeholder.com/600x360?text=Storefront+Home) | ![Product](https://via.placeholder.com/600x360?text=Product+Page) |

| Admin — Realtime Orders | Invoice &amp; Shipping Label |
| :---: | :---: |
| ![Dashboard](https://via.placeholder.com/600x360?text=Realtime+Orders+Dashboard) | ![Invoice](https://via.placeholder.com/600x360?text=Invoice+%2B+Shipping+Label) |

<div align="center">

**🎥 Demo GIF placeholder — drop a screen recording of the checkout → order → notification flow here.**

</div>

---

## 🧠 Technical Decisions &amp; Architecture

- **Next.js App Router over a SPA** — Server Components and Server Actions keep the data-heavy storefront fast and SEO-friendly, while middleware cleanly guards the admin area. On-demand `revalidate` means CMS edits show up on the live site without a redeploy.

- **Supabase as an all-in-one backend** — instead of running a separate API server, Supabase provides **PostgreSQL, Auth, Storage, and Realtime** behind one client. This collapses infrastructure to a single provider and gives the orders dashboard **live updates for free** via Postgres change streams — a perfect fit for a small team that needs enterprise features without the ops overhead.

- **Typed data-access layer (`src/lib/database.ts`)** — all Supabase queries funnel through one typed module, so pages/components never touch raw SQL. This centralizes shape-mapping (e.g. reconciling column names) and makes refactors safe.

- **Inline-styled print templates** — invoices and shipping labels use pure inline styles with hex colors (no Tailwind) because `html2canvas` cannot parse modern `oklch()`/`lab()` color functions. This guarantees pixel-perfect PDF/print output across browsers.

- **RTL-first design** — the entire UI is authored right-to-left in Arabic from the ground up, not retrofitted, ensuring correct layout, iconography, and typography for the target market.

- **Configurable everything** — delivery fees, homepage content, navigation, and branding all live in the database and are editable from the dashboard, so the store owner never needs a developer for day-to-day changes.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch — `git checkout -b feature/amazing-feature`
3. Commit your changes — `git commit -m 'feat: add amazing feature'`
4. Push to the branch — `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow the existing code style (TypeScript, ESLint) and keep commits conventional.

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

> ℹ️ No `LICENSE` file ships with the repo yet — add one (MIT recommended) to activate the badge above.

---

<div align="center">

Built with ❤️ and ☕ by a Full-Stack Developer.

⭐ If you find this project useful, consider giving it a star!

</div>
