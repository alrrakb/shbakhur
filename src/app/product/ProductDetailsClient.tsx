'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/800x800/1a1a1a/D4AF37?text=No+Image';

export interface RelatedProduct {
  id: string | number;
  title: string;
  slug: string;
  price: string;
  sale_price: string | null;
  image: string;
  discount_percentage: number;
  created_at?: string;
}

export interface Product {
  id: string | number;
  title: string;
  name: string;
  description: string;
  short_description: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  discount_percentage: number;
  image: string;
  image_url: string;
  gallery_images: string[];
  sku: string;
  stock: number;
  stock_status: string;
  created_at?: string;
  categoryName?: string;
}

export default function ProductDetailsClient({
  initialProduct,
  relatedProducts = [],
}: {
  initialProduct: Product;
  relatedProducts?: RelatedProduct[];
}) {
  const router = useRouter();
  const [product] = useState<Product>(initialProduct);
  const [selectedImage, setSelectedImage] = useState(() => {
    return product?.image || product?.image_url || PLACEHOLDER_IMAGE_URL;
  });
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  const { addItem } = useCart();

  const productPrice = product?.sale_price || product?.price || '0';
  const originalPrice = product?.regular_price || product?.price || undefined;

  const isNew = product?.created_at
    ? (new Date().getTime() - new Date(product.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;
  
  const hasDiscount = Boolean(
    originalPrice && parseFloat(String(productPrice)) < parseFloat(String(originalPrice))
  );

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    const priceNum = parseFloat(String(productPrice).replace(/[^\d]/g, '')) || 0;
    addItem({
      id: String(product.id),
      name: product.title || product.name || 'Product',
      price: priceNum,
      image: product.image || product.image_url || PLACEHOLDER_IMAGE_URL,
      quantity: quantity,
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push('/checkout'), 600);
  };

  const getMainImage = () => product.image || product.image_url || PLACEHOLDER_IMAGE_URL;

  const getGalleryImages = (): string[] => {
    try {
      if (Array.isArray(product.gallery_images)) return product.gallery_images;
      if (typeof product.gallery_images === 'string') return JSON.parse(product.gallery_images);
    } catch { /* ignore */ }
    return [];
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${numPrice.toLocaleString('ar-SA')} ر.س`;
  };

  const gallery = getGalleryImages();
  const allImages = [getMainImage(), ...gallery.filter(img => img !== getMainImage())];

  return (
    <main className="min-h-screen bg-luxury-black font-cairo">
      <Header />
      
      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' },
              { label: product.title || product.name }
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 mt-6 sm:mt-10 lg:mt-12">
            {/* Gallery Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square bg-[#1a1a1a] rounded-sm overflow-hidden border border-luxury-gold/20 mb-6">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={selectedImage}
                    alt={product.title || product.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>
                
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-30 pointer-events-none">
                  {isNew && (
                    <span className="bg-luxury-gold text-luxury-black px-4 py-1.5 text-sm font-bold rounded-sm shadow-md pointer-events-auto">
                      جديد
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-600 text-white px-4 py-1.5 text-sm font-bold rounded-sm shadow-md pointer-events-auto">
                      خصم {product.discount_percentage ? `${Math.round(product.discount_percentage)}%` : ''}
                    </span>
                  )}
                </div>
              </div>

              {allImages.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-24 h-24 rounded-sm overflow-hidden border-2 transition-all ${
                        selectedImage === img
                          ? 'border-luxury-gold ring-2 ring-luxury-gold/20'
                          : 'border-transparent hover:border-luxury-gold/50 cursor-pointer'
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Meta Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8 flex flex-col"
            >
              <div>
                {product.categoryName && (
                  <p className="text-luxury-gold font-medium mb-3 tracking-wide">{product.categoryName}</p>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                  {product.title || product.name}
                </h1>
                {product.sku && (
                  <p className="text-zinc-500 text-sm">
                    SKU: <span className="text-zinc-400">{product.sku}</span>
                  </p>
                )}
              </div>

              {/* Price Block */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2 border-b border-luxury-gold/10 pb-5 sm:pb-6">
                {hasDiscount ? (
                  <>
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-luxury-gold">
                      {formatPrice(productPrice)}
                    </span>
                    <span className="text-lg sm:text-xl lg:text-2xl text-zinc-500 line-through">
                      {formatPrice(originalPrice as string)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-luxury-gold">
                    {formatPrice(productPrice)}
                  </span>
                )}
              </div>

              {product.short_description && (
                <p className="text-zinc-400 text-lg leading-relaxed pt-2">
                  {product.short_description}
                </p>
              )}

              {/* Action Area */}
              <div className="bg-[#111111] border border-luxury-gold/10 p-4 sm:p-6 rounded-sm mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <span className="text-zinc-300 font-medium whitespace-nowrap text-sm sm:text-base">الكمية:</span>
                  <div className="flex items-center bg-luxury-black border border-luxury-gold/20 rounded-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 text-white hover:text-luxury-gold transition-colors text-lg"
                    >
                      -
                    </button>
                    <span className="px-4 sm:px-6 py-2.5 sm:py-3 text-white font-bold text-base sm:text-lg min-w-[50px] sm:min-w-[60px] text-center border-x border-luxury-gold/20">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 sm:px-5 py-2.5 sm:py-3 text-white hover:text-luxury-gold transition-colors text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`flex-1 px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm transition-all text-lg shadow-lg shadow-luxury-gold/10 ${
                      isAdding ? 'scale-95 opacity-80' : 'hover:bg-luxury-gold-light hover:scale-[1.02]'
                    }`}
                  >
                    {isAdding ? 'تمت الإضافة بنجاح ✓' : 'أضف للسلة'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 px-8 py-4 border-2 border-luxury-gold text-luxury-gold font-bold rounded-sm hover:bg-luxury-gold/10 transition-colors text-lg"
                  >
                    شراء سريع
                  </button>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  {(product.stock_status === 'in_stock' || product.stock > 0) ? (
                    <span className="text-emerald-500 font-medium flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      متوفر في المخزون
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      غير متوفر في المخزون حالياً
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-luxury-gold/20">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">تفاصيل المنتج</h3>
                  <div
                    className="text-zinc-300 leading-relaxed prose prose-invert prose-gold max-w-none prose-p:mb-4 prose-a:text-luxury-gold"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ───── Related Products Section ───── */}
      {relatedProducts.length > 0 && (
        <RelatedProductsSection products={relatedProducts} />
      )}

      <Footer />
    </main>
  );
}

/* ─────────────────────────────────────────
   Related Products Section — uses standard ProductCard
───────────────────────────────────────── */
function RelatedProductsSection({ products }: { products: RelatedProduct[] }) {
  // Map RelatedProduct to the shape ProductCard expects
  const mapped = products.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    price: p.price,
    sale_price: p.sale_price || undefined,
    image: p.image,
    created_at: p.created_at,
  }));

  return (
    <section className="py-12 sm:py-20 bg-[#0d0d0d] border-t border-luxury-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center mb-8 sm:mb-12"
        >
          <div>
            <p className="text-luxury-gold text-xs sm:text-sm font-medium tracking-widest uppercase mb-1 sm:mb-2">
              اكتشف المزيد
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              منتجات موصى بها
            </h2>
          </div>
          <div className="hidden md:block flex-1 h-px bg-gradient-to-l from-luxury-gold/30 to-transparent mx-8" />
        </motion.div>

        {/* Products Grid — identical layout to all product pages */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {mapped.map((product, index) => (
            <ProductCard key={product.id} product={product as any} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
