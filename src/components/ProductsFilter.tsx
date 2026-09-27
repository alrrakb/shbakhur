'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

const EXCLUDED_CATEGORIES = [
  'عروضنا المميزة', 'الأكثر مبيعا', 'عروضنا',
  'best-sellers', 'featured', 'sale', 'special-offers', 'best-offers'
];

export default function ProductsFilter({ 
  categories, 
  basePath = '/products',
  hideCategory = false 
}: { 
  categories: string[];
  basePath?: string;
  hideCategory?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [stock, setStock] = useState(searchParams.get('stock') || '');
  const [discount, setDiscount] = useState(searchParams.get('discount') || '');

  useEffect(() => {
    setCategory(searchParams.get('category') || '');
    setStock(searchParams.get('stock') || '');
    setDiscount(searchParams.get('discount') || '');
  }, [searchParams]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(basePath);
  };

  const filteredCategories = categories.filter(c => !EXCLUDED_CATEGORIES.includes(c));
  const hasFilters = !!(category || stock || discount);

  return (
    <div className="bg-[#141414]/90 backdrop-blur-md border border-luxury-gold/25 rounded-2xl p-4 sm:p-5 mb-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3.5 sm:items-end">

        {/* Category filter */}
        {!hideCategory && filteredCategories.length > 0 && (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
            <label className="text-gray-300 text-xs font-bold flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>التصنيف</span>
            </label>
            <select
              value={category}
              onChange={(e) => updateFilters('category', e.target.value)}
              className="bg-black/60 border border-luxury-gold/30 rounded-xl text-white text-sm px-3.5 py-2.5 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 focus:outline-none w-full transition-all cursor-pointer"
            >
              <option value="">جميع التصنيفات</option>
              {filteredCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Stock filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-gray-300 text-xs font-bold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>حالة المخزون</span>
          </label>
          <select
            value={stock}
            onChange={(e) => updateFilters('stock', e.target.value)}
            className="bg-black/60 border border-luxury-gold/30 rounded-xl text-white text-sm px-3.5 py-2.5 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 focus:outline-none w-full transition-all cursor-pointer"
          >
            <option value="">الكل</option>
            <option value="instock">متوفر للطلب</option>
            <option value="outofstock">نفدت الكمية</option>
          </select>
        </div>

        {/* Discount filter */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <label className="text-gray-300 text-xs font-bold flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V4a2 2 0 10-2 2h2m0 13a2 2 0 11-4 0 2 2 0 014 0zm0 0a2 2 0 104 0 2 2 0 00-4 0z" />
            </svg>
            <span>عروض خاصة</span>
          </label>
          <select
            value={discount}
            onChange={(e) => updateFilters('discount', e.target.value)}
            className="bg-black/60 border border-luxury-gold/30 rounded-xl text-white text-sm px-3.5 py-2.5 focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/50 focus:outline-none w-full transition-all cursor-pointer"
          >
            <option value="">جميع المنتجات</option>
            <option value="discounted">منتجات مخفضة فقط</option>
          </select>
        </div>

        {/* Clear filters button */}
        {hasFilters && (
          <div className="flex flex-col gap-1 justify-end sm:mt-0">
            <span className="text-transparent text-xs select-none hidden sm:block">.</span>
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 transition-all border border-red-500/30 rounded-xl px-4 py-2.5 whitespace-nowrap flex items-center gap-1.5 active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>إعادة ضبط الفلاتر</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
