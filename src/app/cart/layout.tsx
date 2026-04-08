import { Metadata } from 'next';
import { getSeoData } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData('/cart');
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { title: seo.title, description: seo.description, images: seo.og_image ? [seo.og_image] : [] }
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
