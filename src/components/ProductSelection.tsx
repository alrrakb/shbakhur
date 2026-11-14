'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import Link from 'next/link';
import { getCategories, getProductsByCategory, getSiteSettings } from '@/lib/database';
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
  products: Product[];
}

function CategoryIcon({ slug, className = "w-5 h-5 text-luxury-gold" }: { slug: string; className?: string }) {
  switch (slug) {
    case 'incense':
    case 'بخور':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657c0 2.122-.843 4.157-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      );
    case 'enhanced-oud':
    case 'عود-محسن':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2l8 6-8 14L4 8l8-6zM4 8h16M9 2l3 6 3-6" />
        </svg>
      );
    case 'natural-oud':
    case 'عود-طبيعي':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'oud-oil':
    case 'دهن-العود':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
      );
    case 'incense-accessories':
    case 'ملحقات-البخور':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'perfumes':
    case 'العطور':
    case 'عطور':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3h6m-3 0v4m-5 4h10a2 2 0 012 2v6a3 3 0 01-3 3H8a3 3 0 01-3-3v-6a2 2 0 012-2z" />
        </svg>
      );
    case 'special-offers':
    case 'عروضنا':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a2 2 0 002 2h12a2 2 0 002-2V8H12z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
}

export interface ProductSelectionProps {
  initialSections?: CategorySection[];
  initialSettings?: {
    section_title: string;
    section_description: string;
    items_per_section: number;
    sort_order: string;
  };
}

export function ProductSelectionSkeleton() {
  return (
    <section className="py-20 relative z-10" aria-label="تحميل تشكيلة المنتجات">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-pulse">
          <div className="h-10 w-64 bg-luxury-dark/90 rounded-lg mx-auto mb-4 border border-luxury-gold/10" />
          <div className="h-5 w-96 max-w-full bg-luxury-dark/60 rounded mx-auto" />
        </div>

        <div className="space-y-16">
          {[1, 2].map((sec) => (
            <div key={sec} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-luxury-gold/20 animate-pulse">
                <div className="h-7 w-48 bg-luxury-dark/90 rounded border border-luxury-gold/10" />
                <div className="h-5 w-24 bg-luxury-dark/60 rounded" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((card) => (
                  <div 
                    key={card} 
                    className="bg-luxury-dark border border-luxury-gold/10 rounded-2xl p-3 flex flex-col justify-between h-[360px] animate-pulse overflow-hidden relative shadow-lg"
                  >
                    <div className="w-full aspect-square bg-luxury-black/70 rounded-xl mb-3 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-luxury-gold/5 to-transparent animate-pulse" />
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-luxury-black/80 rounded w-4/5" />
                      <div className="h-3 bg-luxury-black/50 rounded w-3/5" />
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="h-5 w-16 bg-luxury-gold/10 rounded border border-luxury-gold/20" />
                      <div className="h-3 w-12 bg-luxury-black/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductSelection({ initialSections, initialSettings }: ProductSelectionProps = {}) {
  const [sections, setSections] = useState<CategorySection[]>(initialSections || []);
  const [loading, setLoading] = useState(!initialSections || initialSections.length === 0);
  const [productSettings, setProductSettings] = useState<{
    section_title: string;
    section_description: string;
    items_per_section: number;
    sort_order: string;
  }>(initialSettings || {
    section_title: 'منتجاتنا',
    section_description: 'اكتشف تشكيلتنا الفاخرة',
    items_per_section: 4,
    sort_order: 'newest',
  });

  useEffect(() => {
    async function loadData() {
      if (initialSections && initialSections.length > 0) {
        return;
      }

      try {
        const dbSettings = await getSiteSettings('products_settings');
        if (dbSettings) setProductSettings(dbSettings);

        const categories = await getCategories();
        
        if (categories.length > 0) {
          const sectionsData: CategorySection[] = await Promise.all(
            categories.slice(0, 6).map(async (cat) => {
              const products = await getProductsByCategory(cat.slug, { limit: productSettings.items_per_section || 4 });
              return {
                id: cat.slug,
                name: cat.name,
                href: `/products/${cat.slug}`,
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
  }, [initialSections]);

  if (loading) {
    return <ProductSelectionSkeleton />;
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

        {/* Category Quick Pills Navigator */}
        {sections.filter(s => s.products.length > 0).length > 1 && (
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-16 px-2">
            {sections.filter(s => s.products.length > 0).map((category, index) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(category.id);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="group flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#181818] border border-luxury-gold/30 hover:border-luxury-gold hover:bg-luxury-gold/10 transition-all text-xs sm:text-sm font-bold text-gray-200 hover:text-luxury-gold shadow-sm hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] active:scale-95"
              >
                <span className="text-luxury-gold group-hover:scale-110 transition-transform">
                  <CategoryIcon slug={category.id} className="w-4 h-4" />
                </span>
                <span>{category.name}</span>
                <span className="text-[10px] sm:text-xs text-luxury-gold/70 bg-luxury-gold/10 px-2 py-0.5 rounded-full font-mono">
                  {category.products.length}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Product Grid by Category */}
        {sections.filter(s => s.products.length > 0).map((category) => {
          const showArrows = category.products.length > 3;
          
          return (
          <div key={category.id} id={category.id} className="mb-12 sm:mb-16 scroll-mt-24 relative">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold">
                  <CategoryIcon slug={category.id} className="w-4 h-4" />
                </span>
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
                spaceBetween={16}
                slidesPerView={1.25}
                dir="rtl"
                breakpoints={{
                  640: { slidesPerView: 2, spaceBetween: 18 },
                  1024: { slidesPerView: 3, spaceBetween: 20 },
                  1280: { slidesPerView: 4, spaceBetween: 22 },
                }}
                className="!pb-4 !pt-1"
              >
                {category.products.map((product, index) => (
                  <SwiperSlide key={product.id} className="!h-auto flex flex-col">
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-luxury-gold/10 border border-luxury-gold/30 mb-4 text-luxury-gold">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات حالياً</h3>
            <p className="text-gray-400 max-w-md mx-auto">
             سنقوم باضافة المنتجات قريباً
            </p>
            <Link href="/products" className="inline-block mt-6 px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light transition-colors">
             تصفح جميع المنتجات
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
