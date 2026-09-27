'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/1a1a1a/D4AF37?text=No+Image';

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

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [isAdded, setIsAdded] = useState(false);

  const productName = product.title;
  const productSlug = product.slug || String(product.id);
  const productPrice = product.sale_price && product.sale_price !== product.price 
    ? product.sale_price 
    : product.price;
  const originalPrice = product.sale_price && product.sale_price !== product.price 
    ? product.price 
    : undefined;
  const categoryName = product.categories?.[0]?.name || '';

  // Badges Logic
  const isNew = product.created_at 
    ? (new Date().getTime() - new Date(product.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000 
    : false;
  
  const discountPercent = originalPrice && parseFloat(String(productPrice)) < parseFloat(String(originalPrice))
    ? Math.round(((parseFloat(String(originalPrice)) - parseFloat(String(productPrice))) / parseFloat(String(originalPrice))) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const priceStr = String(productPrice || '0');
    const priceNum = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
    addItem({
      id: String(product.id),
      name: productName,
      price: priceNum,
      image: product.image || '',
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
    showToast(`تمت إضافة ${productName} للسلة`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "200px" }}
      transition={{ duration: 0.25, delay: (index % 4) * 0.04 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col h-full w-full bg-[#161616] rounded-xl overflow-hidden border border-white/5 hover:border-luxury-gold/50 shadow-md hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] transition-all duration-300"
    >
      {/* Image Section - fixed aspect ratio with instant dark shimmer skeleton */}
      <div className="relative aspect-square overflow-hidden bg-[#181818]">
        <Link 
          href={`/product/${productSlug}`} 
          className="absolute inset-0 z-10 block w-full h-full"
          aria-label={product.short_description ? `${productName} — ${product.short_description}` : productName}
        >
          <Image
            src={product.image && product.image.trim() !== '' ? product.image : PLACEHOLDER_IMAGE}
            alt={productName || 'Product'}
            fill
            priority={index < 6}
            loading={index < 8 ? 'eager' : 'lazy'}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-108 transition-transform duration-500 will-change-transform"
          />
        </Link>
        
        {/* Badges Overlay */}
        <div className="absolute top-2.5 right-2.5 z-30 flex flex-col gap-1.5 pointer-events-none">
          {discountPercent > 0 && (
            <span className="bg-red-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg pointer-events-auto flex items-center gap-0.5">
              <span>خصم</span>
              <span>{discountPercent}%</span>
            </span>
          )}
          {isNew && (
            <span className="bg-luxury-gold text-luxury-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg pointer-events-auto">
              جديد
            </span>
          )}
        </div>

        {/* Desktop: Button appears centered on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20 transition-opacity duration-300 pointer-events-none">
          <button
            onClick={handleAddToCart}
            className={`px-5 py-2.5 font-bold rounded-xl whitespace-nowrap pointer-events-auto shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 ${
              isAdded
                ? 'bg-emerald-500 text-white shadow-emerald-500/50'
                : 'bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black hover:shadow-[0_0_20px_rgba(212,175,55,0.6)]'
            }`}
          >
            {isAdded ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>إضافة للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Section - takes remaining space */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
        <Link 
          href={`/product/${productSlug}`} 
          className="block cursor-pointer flex-1"
        >
          {/* Category - Fixed height row */}
          <div className="h-4 sm:h-5 mb-1 flex items-center">
            {categoryName ? (
              <p className="text-luxury-gold text-xs font-medium truncate opacity-90">{categoryName}</p>
            ) : (
              <span className="invisible text-xs">التصنيف</span>
            )}
          </div>
          
          {/* Title - Fixed Height for 2 lines */}
          <h3 className="text-white font-bold text-sm sm:text-base line-clamp-2 h-[2.6rem] sm:h-[3rem] group-hover:text-luxury-gold transition-colors leading-snug mb-1.5">
            {productName}
          </h3>
          
          {/* Short Description - Fixed Height container for 2 lines */}
          <div className="h-[2.25rem] sm:h-[2.5rem] mb-2 overflow-hidden">
            {product.short_description ? (
              <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed opacity-80">
                {product.short_description}
              </p>
            ) : (
              <span className="invisible text-xs block">وصف المنتج</span>
            )}
          </div>
        </Link>

        {/* Price and Rating - Fixed bottom aligned row */}
        <div className="mt-auto pt-2 flex flex-col border-t border-white/5">
          {/* Top row: Original price & discount */}
          <div className="h-4 flex items-center gap-2 mb-0.5">
            {originalPrice ? (
              <span className="text-gray-500 text-xs line-through">
                {originalPrice} ر.س
              </span>
            ) : (
              <span className="invisible text-xs">0 ر.س</span>
            )}
          </div>
          {/* Bottom row: Current Price and Stars */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-luxury-gold font-extrabold text-base sm:text-lg">{productPrice} ر.س</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-3 h-3 text-luxury-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Button always visible */}
      <div className="lg:hidden px-3 pb-3">
        <button
          onClick={handleAddToCart}
          className={`w-full py-2 font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
            isAdded
              ? 'bg-emerald-500 text-white'
              : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
          }`}
        >
          {isAdded ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>تمت الإضافة بالسلة</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>إضافة للسلة</span>
            </>
          )}
        </button>
      </div>

      {/* Gold Corner Accents */}
      <div className="absolute top-0 right-0 w-0 h-0 border-r-[30px] border-r-transparent border-t-[30px] border-t-luxury-gold/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[30px] border-l-transparent border-b-[30px] border-b-luxury-gold/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
