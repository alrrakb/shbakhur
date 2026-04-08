import { Metadata } from 'next';
import Header from '@/components/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import ProductsFilter from '@/components/ProductsFilter';
import { getProducts } from '@/lib/database';

import { getSeoData } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoData('/products');
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { title: seo.title, description: seo.description, images: seo.og_image ? [seo.og_image] : [] }
  };
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const products = await getProducts();
  
  const searchQ = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search.toLowerCase() : '';
  const categoryFilter = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : '';
  const stockFilter = typeof resolvedSearchParams.stock === 'string' ? resolvedSearchParams.stock : '';
  const discountFilter = typeof resolvedSearchParams.discount === 'string' ? resolvedSearchParams.discount : '';
  
  const filteredProducts = products.filter(p => {
    // Search filter
    const catStr = (p.categories || []).map((c: any) => c.name).join(' ').toLowerCase();
    const matchesSearch = searchQ ? (
      p.title.toLowerCase().includes(searchQ) || 
      (p.short_description || '').toLowerCase().includes(searchQ) ||
      catStr.includes(searchQ)
    ) : true;
    
    // Category filter
    const matchesCategory = categoryFilter ? (p.categories || []).some((c: any) => c.name === categoryFilter) : true;
    
    // Stock filter
    const matchesStock = stockFilter ? (p as any).stock_status === stockFilter : true;
    
    // Discount filter
    const isDiscounted = p.sale_price && p.regular_price && Number(p.sale_price) < Number(p.regular_price) && Number(p.sale_price) > 0;
    const matchesDiscount = discountFilter === 'discounted' ? isDiscounted : true;
    
    return matchesSearch && matchesCategory && matchesStock && matchesDiscount;
  });

  const uniqueCategories = Array.from(new Set(products.flatMap(p => (p.categories || []).map((c: any) => c.name)))).filter(Boolean) as string[];

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      
      <div className="pt-32 pb-16">
        <Breadcrumb
          items={[
            { label: 'الرئيسية', href: '/' },
            { label: 'جميع المنتجات' },
          ]}
        />
        
        <PageHeader 
          title={searchQ ? `نتائج البحث عن: ${searchQ}` : "جميع المنتجات"}
          description={searchQ ? `${filteredProducts.length} منتج متطابق` : "مجموعة متكاملة من أجود أنواع البخور والعطور والعود الطبيعي"}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <ProductsFilter categories={uniqueCategories} basePath="/products" />
        </div>
        
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-400">لا توجد نتائج مطابقة لبحثك أو للفلتر المحدد</h2>
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
}
