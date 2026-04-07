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

export default function ProductGrid({ products }: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('default');

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = parseFloat(a.sale_price || a.price || '0');
    const priceB = parseFloat(b.sale_price || b.price || '0');
    
    switch (sortBy) {
      case 'price-asc':
        return priceA - priceB;
      case 'price-desc':
        return priceB - priceA;
      default:
        return String(a.id).localeCompare(String(b.id));
    }
  });

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'الافتراضي' },
    { value: 'price-asc', label: 'السعر: من الأقل' },
    { value: 'price-desc', label: 'السعر: من الأعلى' },
    { value: 'newest', label: 'الأحدث' },
  ];

  return (
    <section className="py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <p className="text-gray-400">{sortedProducts.length} منتج</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 text-sm">ترتيب:</span>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`px-4 py-2 text-sm rounded-sm border transition-colors ${
                  sortBy === option.value
                    ? 'bg-luxury-gold text-luxury-black border-luxury-gold'
                    : 'bg-luxury-dark text-gray-400 border-luxury-gold/20 hover:border-luxury-gold/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">لا توجد منتجات</p>
          </div>
        )}
      </div>
    </section>
  );
}
