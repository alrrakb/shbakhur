import { Metadata } from 'next';
import Header from '@/components/Header';
import Breadcrumb from '@/components/layout/Breadcrumb';
import PageHeader from '@/components/layout/PageHeader';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/database';

export const metadata: Metadata = {
  title: 'جميع المنتجات | SH للبخور',
  description: 'تسوق أجود أنواع البخور والعطور والعود الطبيعي من متجر SH للبخور',
};

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const products = await getProducts();
  
  const searchQ = typeof searchParams.search === 'string' ? searchParams.search.toLowerCase() : '';
  
  const filteredProducts = searchQ 
    ? products.filter(p => {
        const catStr = (p.categories || []).map((c: any) => c.name).join(' ').toLowerCase();
        return (
          p.title.toLowerCase().includes(searchQ) || 
          (p.short_description || '').toLowerCase().includes(searchQ) ||
          catStr.includes(searchQ)
        );
      })
    : products;

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
        
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-400">لا توجد نتائج مطابقة لبحثك</h2>
          </div>
        )}
      </div>
      
      <Footer />
    </main>
  );
}
