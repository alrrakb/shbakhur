import { Metadata } from 'next';
import Header from '@/components/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getProductsByCategory } from '@/lib/database';

interface PageProps {
  params: Promise<{ category: string }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  sale_price: string;
  image: string;
  short_description?: string;
  is_active: boolean;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  
  // Handle special routes
  if (category === 'featured' || category === 'best-sellers' || category === 'best-offers') {
    return {
      title: 'الأكثر مبيعا | SH للبخور',
      description: 'تسوق الأكثر مبيعا من متجر SH للبخور - أجود أنواع البخور والعطور والعود',
    };
  }
  
  if (category === 'best-offers' || category === 'عروضنا-المميزة' || category === 'special-offers' || category === 'sale') {
    return {
      title: 'عروضنا | SH للبخور',
      description: 'تسوق العروض والتخفيضات من متجر SH للبخور',
    };
  }
  
  if (category === 'oud' || category === 'bakhour' || category === 'البخور-والعود' || category === 'bakhour-oud') {
    return {
      title: 'البخور والعود | SH للبخور',
      description: 'تسوق أجود أنواع البخور والعود الطبيعي من متجر SH للبخور',
    };
  }
  
  // Decode URL-encoded category slug
  const decodedSlug = decodeURIComponent(category);
  
  const { data: catData } = await supabase
    .from('categories')
    .select('name, slug')
    .or(`slug.eq.${category},slug.eq.${decodedSlug}`)
    .limit(1);
  
  const title = catData?.[0]?.name || 'المنتجات';
  
  return {
    title: `${title} | SH للبخور`,
    description: `تسوق ${title} من متجر SH للبخور - أجود أنواع البخور والعطور والعود`,
  };
}

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  // Try exact match first
  const decodedSlug = decodeURIComponent(slug);
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .or(`slug.eq.${slug},slug.eq.${decodedSlug}`)
    .limit(1);
  
  if (error || !data || data.length === 0) return null;
  return data[0] as Category;
}

async function getSaleProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, sale_price, image, short_description')
    .eq('is_active', true)
    .not('sale_price', 'is', null)
    .not('sale_price', 'eq', '')
    .not('price', 'is', null)
    .not('price', 'eq', '')
    .order('id', { ascending: false });

  if (error || !data) return [];
  const filtered = data.filter(p => {
    const price = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
    const salePrice = parseFloat(String(p.sale_price).replace(/[^0-9.]/g, ''));
    return salePrice > 0 && salePrice < price;
  });
  return filtered.map(p => ({
    id: p.id.toString(),
    title: p.title,
    price: p.price?.toString() || '0',
    sale_price: p.sale_price?.toString() || '',
    image: p.image || '',
    short_description: p.short_description || '',
    is_active: true
  }));
}
function getCategoryInfo(slug: string): { name: string; description: string } | null {
  const categories: Record<string, { name: string; description: string }> = {
    'best-sellers': { name: 'الأكثر مبيعا', description: 'أفضل المنتجات الأكثر طلباً من عملائنا' },
    'featured': { name: 'الأكثر مبيعا', description: 'أفضل المنتجات الأكثر طلباً من عملائنا' },
    'best-offers': { name: 'عروضنا المميزة', description: 'تخفيضات وعروض خاصة على منتجات مختارة' },
    'sale': { name: 'عروضنا', description: 'تخفيضات وعروض خاصة على منتجات مختارة' },
    'عروضنا-المميزة': { name: 'عروضنا المميزة', description: 'تخفيضات وعروض خاصة على منتجات مختارة' },
    'special-offers': { name: 'عروضنا المميزة', description: 'تخفيضات وعروض خاصة على منتجات مختارة' },
    'perfumes': { name: 'العطور', description: 'أفضل العطور العالمية والعربية' },
    'oud': { name: 'البخور والعود', description: 'أجود أنواع البخور والعود الطبيعي' },
    'bakhour': { name: 'البخور والعود', description: 'أجود أنواع البخور والعود الطبيعي' },
    'البخور-والعود': { name: 'البخور والعود', description: 'أجود أنواع البخور والعود الطبيعي' },
    'bakhour-oud': { name: 'البخور والعود', description: 'أجود أنواع البخور والعود الطبيعي' },
  };
  return categories[slug] || null;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  
  // Handle special routes
  if (slug === 'featured' || slug === 'best-sellers' || slug === 'best-offers') {
    const products = await getAllProducts();
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <Breadcrumb items={[{ label: 'الرئيسية', href: '/' }, { label: 'الأكثر مبيعا' }]} />
          <PageHeader title="الأكثر مبيعا" description="أفضل المنتجات الأكثر طلباً من عملائنا" />
          <ProductGrid products={products} />
        </div>
        <Footer />
      </main>
    );
  }
  
  if (slug === 'best-offers' || slug === 'sale' || slug === 'عروضنا-المميزة' || slug === 'special-offers') {
    const products = await getSaleProducts();
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <Breadcrumb items={[{ label: 'الرئيسية', href: '/' }, { label: 'عروضنا' }]} />
          <PageHeader title="عروضنا المميزة" description="تخفيضات وعروض خاصة على منتجات مختارة" />
          <ProductGrid products={products} />
        </div>
        <Footer />
      </main>
    );
  }
  
  if (slug === 'oud' || slug === 'bakhour' || slug === 'البخور-والعود' || slug === 'bakhour-oud') {
    const rawProducts = await getProductsByCategory('incense');
    const products = rawProducts.map(p => ({
      id: p.id ? p.id.toString() : '',
      title: p.title || '',
      price: p.price?.toString() || p.regular_price?.toString() || '0',
      sale_price: p.sale_price?.toString() || '',
      image: p.image || '',
      short_description: p.short_description || '',
      is_active: true
    }));
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <Breadcrumb items={[{ label: 'الرئيسية', href: '/' }, { label: 'البخور والعود' }]} />
          <PageHeader title="البخور والعود" description="أجود أنواع البخور والعود الطبيعي" />
          <ProductGrid products={products} />
        </div>
        <Footer />
      </main>
    );
  }
  
  // Get category from database
  const category = await getCategoryBySlug(slug);
  
  // If category exists, get products
  if (category) {
    const rawProducts = await getProductsByCategory(category.slug);
    const products = rawProducts.map(p => ({
      id: p.id ? p.id.toString() : '',
      title: p.title || '',
      price: p.price?.toString() || p.regular_price?.toString() || '0',
      sale_price: p.sale_price?.toString() || '',
      image: p.image || '',
      short_description: p.short_description || '',
      is_active: true
    }));
    
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' },
              { label: category.name }
            ]}
          />
          <PageHeader 
            title={category.name} 
            description={category.description || `تصفح أفضل ${category.name} من متجر SH للبخور`}
          />
          <ProductGrid products={products} />
        </div>
        <Footer />
      </main>
    );
  }
  
  // Check if there's a static category info for this slug
  const staticInfo = getCategoryInfo(slug);
  if (staticInfo) {
    const rawProducts = await getProductsByCategory(slug);
    const products = rawProducts.map(p => ({
      id: p.id ? p.id.toString() : '',
      title: p.title || '',
      price: p.price?.toString() || p.regular_price?.toString() || '0',
      sale_price: p.sale_price?.toString() || '',
      image: p.image || '',
      short_description: p.short_description || '',
      is_active: true
    }));
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' },
              { label: staticInfo.name }
            ]}
          />
          <PageHeader title={staticInfo.name} description={staticInfo.description} />
          <ProductGrid products={products} />
        </div>
        <Footer />
      </main>
    );
  }
  
  // Category not found
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <div className="pt-32">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'غير موجود' }
          ]}
        />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">التصنيف غير موجود</h1>
          <p className="text-gray-400">عذراً، هذا التصنيف غير متوفر.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}

async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, sale_price, image, short_description, is_active')
    .eq('is_active', true)
    .order('id', { ascending: false });

  if (error || !data) return [];
  return data as Product[];
}
