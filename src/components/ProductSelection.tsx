'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { getCategories, getProductsByCategory } from '@/lib/database';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface Product {
  id: number | string;
  title: string;
  price: string;
  sale_price?: string;
  image: string;
  short_description?: string;
  categories?: { id: number | string; name: string; slug: string }[];
}

interface CategorySection {
  id: string;
  name: string;
  href: string;
  icon: string;
  products: Product[];
}

const categoryIcons: Record<string, string> = {
  incense: '🔥',
  'enhanced-oud': '💎',
  'natural-oud': '🪵',
  'oud-oil': '💧',
  'incense-accessories': '🏺',
  perfumes: '✨',
  'special-offers': '🎁',
  'tom-ford-perfumes': '👑',
  'gucci-perfumes': '🌸',
  'dior-perfumes': '💄',
};

export default function ProductSelection() {
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [productSettings, setProductSettings] = useState<{
    section_title: string;
    section_description: string;
    items_per_section: number;
    sort_order: string;
  }>({
    section_title: 'منتجاتنا',
    section_description: 'اكتشف تشكيلتنا الفاخرة',
    items_per_section: 4,
    sort_order: 'newest',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const categories = await getCategories();
        
        if (categories.length > 0) {
          const sectionsData: CategorySection[] = await Promise.all(
            categories.slice(0, 6).map(async (cat) => {
              const products = await getProductsByCategory(cat.slug, { limit: productSettings.items_per_section || 4 });
              return {
                id: cat.slug,
                name: cat.name,
                href: `/products/${cat.slug}`,
                icon: categoryIcons[cat.slug] || '📦',
                products,
              };
            })
          );
          
          setSections(sectionsData);
        }
      } catch (error) {
        console.error('Error loading product sections:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-luxury-gold mx-auto"></div>
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {productSettings.section_title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {productSettings.section_description}
          </p>
        </motion.div>

        {/* Categories - Hidden */}
        {false && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {sections.map((category, index) => (
            <Link key={category.id} href={category.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group bg-luxury-dark border border-luxury-gold/20 hover:border-luxury-gold/50 rounded-sm p-4 text-center transition-all duration-300"
              >
                <span className="text-3xl mb-2 block">{category.icon}</span>
                <h3 className="text-white font-bold text-sm group-hover:text-luxury-gold transition-colors">
                  {category.name}
                </h3>
              </motion.div>
            </Link>
          ))}
        </div>
        )}

        {/* Product Grid by Category */}
        {sections.filter(s => s.products.length > 0).map((category) => {
          const showArrows = category.products.length > 3;
          
          return (
          <div key={category.id} id={category.id} className="mb-20 scroll-mt-24 relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-2xl">{category.icon}</span>
                {category.name}
              </h3>
              <div className="flex items-center gap-4 sm:gap-6">
                {showArrows && (
                  <div className="hidden sm:flex items-center gap-2">
                    {/* RTL: Prev goes Right */}
                    <button className={`swiper-button-prev-${category.id} w-10 h-10 rounded-full border border-luxury-gold/30 text-luxury-gold flex items-center justify-center hover:bg-luxury-gold hover:text-luxury-black transition-all cursor-pointer z-10 bg-luxury-black/50 disabled:opacity-30 disabled:cursor-not-allowed`} aria-label="السابق">
                      <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    {/* RTL: Next goes Left */}
                    <button className={`swiper-button-next-${category.id} w-10 h-10 rounded-full border border-luxury-gold/30 text-luxury-gold flex items-center justify-center hover:bg-luxury-gold hover:text-luxury-black transition-all cursor-pointer z-10 bg-luxury-black/50 disabled:opacity-30 disabled:cursor-not-allowed`} aria-label="التالي">
                      <svg className="w-5 h-5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>
                )}
                <Link href={category.href} className="text-luxury-gold hover:text-luxury-gold-light transition-colors flex items-center gap-2 whitespace-nowrap text-sm sm:text-base">
                  عرض المزيد
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
              <Swiper
                modules={[Navigation]}
                navigation={showArrows ? {
                  prevEl: `.swiper-button-prev-${category.id}`,
                  nextEl: `.swiper-button-next-${category.id}`,
                } : false}
                spaceBetween={24}
                slidesPerView={1.25}
                dir="rtl"
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 24 },
                  1024: { slidesPerView: 3, spaceBetween: 24 },
                  1280: { slidesPerView: 4, spaceBetween: 24 },
                }}
                className="!pb-6 !pt-2"
              >
                {category.products.map((product, index) => (
                  <SwiperSlide key={product.id} className="h-auto">
                    <ProductCard product={product} index={index} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )})}

        {/* No Products Message */}
        {sections.length > 0 && sections.every(s => s.products.length === 0) && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-luxury-gold/10 mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات حالياً</h3>
            <p className="text-gray-400 max-w-md mx-auto">
             سنقوم باضافة المنتجات قريباً
            </p>
            <Link href="/products" className="inline-block mt-6 px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors">
             تصفح جميع المنتجات
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
