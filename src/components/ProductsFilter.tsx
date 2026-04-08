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
    <div className="bg-[#1a1a1a] border border-luxury-gold/20 rounded-sm p-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-end">

        {/* Category filter */}
        {!hideCategory && filteredCategories.length > 0 && (
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-gray-400 text-xs font-medium">التصنيف</label>
            <select
              value={category}
              onChange={(e) => updateFilters('category', e.target.value)}
              className="bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm px-3 py-2 focus:border-luxury-gold focus:outline-none w-full"
            >
              <option value="">جميع التصنيفات</option>
              {filteredCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Stock filter */}
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-gray-400 text-xs font-medium">حالة المخزون</label>
          <select
            value={stock}
            onChange={(e) => updateFilters('stock', e.target.value)}
            className="bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm px-3 py-2 focus:border-luxury-gold focus:outline-none w-full"
          >
            <option value="">الكل</option>
            <option value="instock">متوفر للطلب</option>
            <option value="outofstock">نفدت الكمية</option>
          </select>
        </div>

        {/* Discount filter */}
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-gray-400 text-xs font-medium">عروض خاصة</label>
          <select
            value={discount}
            onChange={(e) => updateFilters('discount', e.target.value)}
            className="bg-luxury-black border border-luxury-gold/20 rounded-sm text-white text-sm px-3 py-2 focus:border-luxury-gold focus:outline-none w-full"
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
              className="text-sm text-red-400 hover:text-red-300 transition-colors border border-red-400/30 hover:border-red-300/50 rounded-sm px-4 py-2 whitespace-nowrap"
            >
              ✖ مسح الفلاتر
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
