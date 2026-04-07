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

export default async function AllProductsPage() {
  const products = await getProducts();

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
          title="جميع المنتجات" 
          description="مجموعة متكاملة من أجود أنواع البخور والعطور والعود الطبيعي"
        />
        
        <ProductGrid products={products} />
      </div>
      
      <Footer />
    </main>
  );
}
