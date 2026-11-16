import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustFeatures from '@/components/TrustFeatures';
import ProductSelection from '@/components/ProductSelection';
import Testimonials from '@/components/Testimonials';
import Partners from '@/components/Partners';
import Footer from '@/components/Footer';
import { Metadata } from 'next';
import { getSeoData } from '@/lib/seo';
import { getCategories, getProductsByCategory, getSiteSettings, getStoreWhatsAppNumber } from '@/lib/database';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData('/');
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { title: seo.title, description: seo.description, images: seo.og_image ? [seo.og_image] : [] },
    alternates: { canonical: '/' },
  };
}

export default async function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shbkhur.com';
  const cleanPhone = await getStoreWhatsAppNumber();
  const telephone = `+${cleanPhone}`;

  // Pre-fetch initial product sections for instant SSR rendering (zero CLS, zero spinner)
  let initialSections: any[] = [];
  try {
    const categories = await getCategories();
    if (categories && categories.length > 0) {
      initialSections = await Promise.all(
        categories.slice(0, 6).map(async (cat) => {
          const products = await getProductsByCategory(cat.slug, { limit: 4 });
          return {
            id: cat.slug,
            name: cat.name,
            href: `/products/${cat.slug}`,
            products,
          };
        })
      );
    }
  } catch (err) {
    console.error('Failed to pre-fetch homepage product sections:', err);
  }

  // ── Construct 2026 Organization & OnlineStore Entity Schema ────────────────
  // Note: paymentAccepted array is strictly omitted per Founder directive until TASK-001.
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'OnlineStore'],
    '@id': `${siteUrl}/#organization`,
    name: 'متجر SH للبخور والعطور الفاخرة',
    alternateName: 'SH BAKHUR',
    url: siteUrl,
    logo: `${siteUrl}/favicon.png`,
    image: `${siteUrl}/og-image.png`,
    description:
      'متجر SH للبخور والعطور الفاخرة - متخصص في أجود درجات العود الطبيعي والمحسن، دهن العود الصافي، وعطور النيش الفاخرة في المملكة العربية السعودية ودول الخليج.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'الرياض',
      addressRegion: 'منطقة الرياض',
      addressCountry: 'SA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: telephone,
      contactType: 'customer service',
      availableLanguage: ['Arabic', 'English'],
      areaServed: 'SA',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <main className="min-h-screen bg-luxury-black">
      {/* 2026 OnlineStore & Brand Entity Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <Header />
      <Hero />
      <TrustFeatures />
      <ProductSelection initialSections={initialSections} />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  );
}
