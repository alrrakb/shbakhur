'use client';

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
  
  const hasDiscount = Boolean(
    originalPrice && parseFloat(String(productPrice)) < parseFloat(String(originalPrice))
  );

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
    showToast(`تمت إضافة ${productName} للسلة`, 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col h-full bg-luxury-dark rounded-sm overflow-hidden border border-transparent hover:border-luxury-gold/50 transition-all duration-300"
    >
      {/* Image Section - fixed aspect ratio */}
      <div className="relative aspect-square overflow-hidden">
        <Link 
          href={`/product/${productSlug}`} 
          className="absolute inset-0 z-10"
          aria-label={product.short_description ? `${productName} — ${product.short_description}` : productName}
        >
          <Image
            src={product.image && product.image.trim() !== '' ? product.image : PLACEHOLDER_IMAGE}
            alt={productName || 'Product'}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </Link>
        
        {/* Badges Overlay */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 pointer-events-none">
          {isNew && (
            <span className="bg-luxury-gold text-luxury-black px-3 py-1 text-xs font-bold rounded-sm shadow-md pointer-events-auto">
              جديد
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-sm shadow-md pointer-events-auto">
              خصم
            </span>
          )}
        </div>

        {/* Desktop: Button appears centered on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 lg:group-hover:opacity-100 z-20 transition-opacity duration-300 pointer-events-none">
          <button
            onClick={handleAddToCart}
            className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors whitespace-nowrap pointer-events-auto shadow-lg"
          >
            إضافة للسلة
          </button>
        </div>
      </div>

      {/* Content Section - takes remaining space */}
      <div className="p-4 flex flex-col flex-1">
        <Link 
          href={`/product/${productSlug}`} 
          className="block cursor-pointer flex-1"
        >
          {/* Category */}
          {categoryName && (
            <p className="text-luxury-gold text-sm mb-1">{categoryName}</p>
          )}
          
          {/* Title - Fixed Height for 2 lines */}
          <h3 className="text-white font-semibold text-lg lg:text-base xl:text-lg mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-luxury-gold transition-colors">
            {productName}
          </h3>
          
          {/* Short Description - Always rendered to lock grid height */}
          <p className="text-zinc-400 text-sm line-clamp-2 min-h-[2.5rem] mt-2">
            {product.short_description || ''}
          </p>
        </Link>

        {/* Price and Rating - pushed to bottom with mt-auto */}
        <div className="mt-auto pt-3 flex flex-col">
          {/* Top row: Original price (invisible space if none) */}
          <div className="h-5 flex items-center mb-1">
            <span className={`text-gray-500 text-sm line-through ${originalPrice ? '' : 'invisible'}`}>
              {originalPrice ? `${originalPrice} ر.س` : '0'}
            </span>
          </div>
          {/* Bottom row: Current Price and Stars */}
          <div className="flex items-center justify-between">
            <span className="text-luxury-gold font-bold text-xl">{productPrice} ر.س</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4 text-luxury-gold"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Button always visible */}
      <div className="lg:hidden px-4 pb-4">
        <button
          onClick={handleAddToCart}
          className="w-full py-2 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors text-sm"
        >
          إضافة للسلة
        </button>
      </div>

      {/* Gold Corner Accents */}
      <div className="absolute top-0 right-0 w-0 h-0 border-r-[30px] border-r-transparent border-t-[30px] border-t-luxury-gold/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[30px] border-l-transparent border-b-[30px] border-b-luxury-gold/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
