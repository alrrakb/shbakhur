import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductSelection from '@/components/ProductSelection';
import Testimonials from '@/components/Testimonials';
import Partners from '@/components/Partners';
import Footer from '@/components/Footer';
import { Metadata } from 'next';
import { getSeoData } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData('/');
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { title: seo.title, description: seo.description, images: seo.og_image ? [seo.og_image] : [] }
  };
}

export default function Home() {
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <Hero />
      <ProductSelection />
      <Testimonials />
      <Partners />
      <Footer />
    </main>
  );
}
