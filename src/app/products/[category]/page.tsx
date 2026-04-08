import { Metadata } from 'next';
import Header from '@/components/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { getProductsByCategory, getAllProducts, getSaleProducts } from '@/lib/database';
import ProductsFilter from '@/components/ProductsFilter';

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

import { getSeoData } from '@/lib/seo';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  
  // Format the path exactly how it's stored in the DB (based on what the user defined)
  let pathStr = `/${category}`;
  
  const seo = await getSeoData(pathStr);
  
  // Fallback map if the raw category name isn't exactly mapping, but since we set exactly those paths like /best-sellers /oud /tomford, we can just use the DB directly!
  if (seo && seo.title) {
    return {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      openGraph: { title: seo.title, description: seo.description, images: seo.og_image ? [seo.og_image] : [] }
    };
  }
  
  return {
    title: 'جميع المنتجات | SH للبخور',
    description: 'تسوق أجود أنواع البخور والعطور والعود الطبيعي من متجر SH للبخور',
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

export default async function CategoryPage({ 
  params,
  searchParams
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category: slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  let pageTitle = '';
  let pageDesc = '';
  let rawProducts: any[] = [];
  let isCategoriesHidden = true;

  // Handle special routes
  if (slug === 'featured' || slug === 'best-sellers' || slug === 'best-offers') {
    pageTitle = 'الأكثر مبيعا';
    pageDesc = 'أفضل المنتجات الأكثر طلباً من عملائنا';
    rawProducts = await getAllProducts();
  }
  else if (slug === 'best-offers' || slug === 'sale' || slug === 'عروضنا-المميزة' || slug === 'special-offers') {
    pageTitle = 'عروضنا المميزة';
    pageDesc = 'تخفيضات وعروض خاصة على منتجات مختارة';
    rawProducts = await getSaleProducts();
  }
  else if (slug === 'oud' || slug === 'bakhour' || slug === 'البخور-والعود' || slug === 'bakhour-oud') {
    pageTitle = 'البخور والعود';
    pageDesc = 'أجود أنواع البخور والعود الطبيعي';
    rawProducts = await getProductsByCategory('incense');
    isCategoriesHidden = false;
  }
  else {
    const staticInfo = getCategoryInfo(slug);
    if (staticInfo) {
       pageTitle = staticInfo.name;
       pageDesc = staticInfo.description;
       rawProducts = await getProductsByCategory(slug);
       if (slug === 'perfumes') {
         isCategoriesHidden = false;
       }
    } else {
      const category = await getCategoryBySlug(slug);
      if (category) {
         pageTitle = category.name;
         pageDesc = category.description || `تصفح أفضل ${category.name} من متجر SH للبخور`;
         rawProducts = await getProductsByCategory(category.slug);
      } else {
        return (
          <main className="min-h-screen bg-luxury-black">
            <Header />
            <div className="pt-32">
              <Breadcrumb items={[{ label: 'الرئيسية', href: '/' }, { label: 'غير موجود' }]} />
              <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">التصنيف غير موجود</h1>
                <p className="text-gray-400">عذراً، هذا التصنيف غير متوفر.</p>
              </div>
            </div>
            <Footer />
          </main>
        );
      }
    }
  }

  const stockFilter = typeof resolvedSearchParams.stock === 'string' ? resolvedSearchParams.stock : '';
  const discountFilter = typeof resolvedSearchParams.discount === 'string' ? resolvedSearchParams.discount : '';
  const subCategoryFilter = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : '';

  let filteredProducts = rawProducts.filter(p => {
    if (subCategoryFilter && p.categories) {
      const pCats = p.categories.map((c: any) => c.name);
      if (!pCats.includes(subCategoryFilter)) return false;
    }
    
    if (stockFilter) {
       if (stockFilter === 'instock' && p.stock_status !== 'instock') return false;
       if (stockFilter === 'outofstock' && p.stock_status !== 'outofstock') return false;
    }

    if (discountFilter === 'discounted') {
      const isDiscounted = p.sale_price && p.price && Number(p.sale_price) < Number(p.price) && Number(p.sale_price) > 0;
      if (!isDiscounted) return false;
    }

    return true;
  });

  const uniqueCategories = Array.from(new Set(rawProducts.flatMap(p => (p.categories || []).map((c: any) => c.name)))).filter(Boolean) as string[];

  const finalProducts = filteredProducts.map(p => ({
    id: p.id ? p.id.toString() : '',
    title: p.title || '',
    slug: p.slug || '',
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
        <Breadcrumb items={[{ label: 'الرئيسية', href: '/' }, { label: 'المنتجات', href: '/products' }, { label: pageTitle }]} />
        <PageHeader title={pageTitle} description={pageDesc} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <ProductsFilter 
             categories={uniqueCategories} 
             hideCategory={isCategoriesHidden} 
             basePath={`/products/${slug}`} 
          />
        </div>

        <ProductGrid products={finalProducts} />
      </div>
      <Footer />
    </main>
  );
}
