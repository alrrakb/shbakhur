'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

interface Product {
  id: number | string;
  title: string;
  slug?: string;
  price: string;
  sale_price?: string;
  regular_price?: string;
  image: string;
  short_description?: string;
  created_at?: string;
  categories?: { id: number | string; name: string; slug: string }[];
}

interface ProductGridProps {
  products: Product[];
}

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'newest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'الافتراضي' },
  { value: 'price-asc', label: 'السعر: من الأقل' },
  { value: 'price-desc', label: 'السعر: من الأعلى' },
  { value: 'newest', label: 'الأحدث' },
];

export default function ProductGrid({ products }: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = parseFloat(a.sale_price || a.price || '0');
    const priceB = parseFloat(b.sale_price || b.price || '0');
    switch (sortBy) {
      case 'price-asc':  return priceA - priceB;
      case 'price-desc': return priceB - priceA;
      default:           return String(a.id).localeCompare(String(b.id));
    }
  });

  return (
    <section className="pb-16 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sort Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <p className="text-gray-400 text-sm">
            <span className="text-luxury-gold font-bold">{sortedProducts.length}</span> منتج
          </p>

          {/* Mobile: select dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">ترتيب حسب:</span>

            {/* Mobile dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sm:hidden bg-luxury-dark border border-luxury-gold/20 text-white text-sm px-3 py-2 rounded-sm focus:border-luxury-gold focus:outline-none flex-1"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
                    sortBy === option.value
                      ? 'bg-luxury-gold text-luxury-black border-luxury-gold font-bold'
                      : 'bg-luxury-dark text-gray-400 border-luxury-gold/20 hover:border-luxury-gold/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-luxury-gold/10 mb-4">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-gray-500 text-lg">لا توجد منتجات مطابقة للفلتر</p>
            <p className="text-gray-600 text-sm mt-2">جرب تغيير خيارات الفلترة</p>
          </div>
        )}
      </div>
    </section>
  );
}
