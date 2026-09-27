'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/800x800/1a1a1a/D4AF37?text=No+Image';

export interface RelatedProduct {
  id: string | number;
  title: string;
  short_description?: string;
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
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product] = useState<Product>(initialProduct);
  const [selectedImage, setSelectedImage] = useState(() => {
    return product?.image || product?.image_url || PLACEHOLDER_IMAGE_URL;
  });
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const productPrice = product?.sale_price || product?.price || '0';
  const originalPrice = product?.regular_price || product?.price || undefined;

  const numPrice = parseFloat(String(productPrice).replace(/[^\d.]/g, '')) || 0;
  const numOrigPrice = originalPrice ? parseFloat(String(originalPrice).replace(/[^\d.]/g, '')) : 0;

  const isNew = product?.created_at
    ? new Date().getTime() - new Date(product.created_at).getTime() < 14 * 24 * 60 * 60 * 1000
    : false;

  const hasDiscount = Boolean(numOrigPrice > numPrice && numPrice > 0);
  const calculatedDiscountPct = hasDiscount
    ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100)
    : product.discount_percentage || 0;

  // Monthly installment (4 payments)
  const installmentAmount = (numPrice / 4).toFixed(0);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    addItem({
      id: String(product.id),
      name: product.title || product.name || 'Product',
      price: numPrice,
      image: product.image || product.image_url || PLACEHOLDER_IMAGE_URL,
      quantity: quantity,
    });

    showToast(`تمت إضافة "${product.title || product.name}" إلى سلتك`, 'success', {
      label: 'عرض السلة ←',
      href: '/cart',
    });

    setTimeout(() => setIsAdding(false), 500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setTimeout(() => router.push('/checkout'), 300);
  };

  const getMainImage = () => product.image || product.image_url || PLACEHOLDER_IMAGE_URL;

  const getGalleryImages = (): string[] => {
    try {
      if (Array.isArray(product.gallery_images)) return product.gallery_images;
      if (typeof product.gallery_images === 'string') return JSON.parse(product.gallery_images);
    } catch {
      /* ignore */
    }
    return [];
  };

  const formatPrice = (price: string | number): string => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return `${p.toLocaleString('ar-SA')} ر.س`;
  };

  const gallery = getGalleryImages();
  const allImages = [getMainImage(), ...gallery.filter((img) => img !== getMainImage())];

  return (
    <main className="min-h-screen bg-luxury-black font-cairo">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'الرئيسية', href: '/' },
              { label: 'المنتجات', href: '/products' },
              { label: product.title || product.name },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 mt-6 sm:mt-10 lg:mt-12 items-start">
            
            {/* ── Gallery Section ────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-28"
            >
              <div className="relative aspect-square bg-luxury-dark rounded-2xl overflow-hidden border border-luxury-gold/30 shadow-2xl mb-4 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={selectedImage}
                    alt={product.title || product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Badges Overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-30 pointer-events-none">
                  {isNew && (
                    <span className="bg-luxury-gold text-luxury-black px-3.5 py-1.5 text-xs font-bold rounded-full shadow-lg pointer-events-auto flex items-center gap-1">
                      <span>وصل حديثاً</span>
                      <svg className="w-3.5 h-3.5 text-luxury-black" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
                      </svg>
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-red-600 text-white px-3.5 py-1.5 text-xs font-bold rounded-full shadow-lg pointer-events-auto">
                      خصم {calculatedDiscountPct}%
                    </span>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === img
                          ? 'border-luxury-gold ring-2 ring-luxury-gold/30 scale-105 shadow-md'
                          : 'border-luxury-gold/20 opacity-70 hover:opacity-100 hover:border-luxury-gold/50'
                      }`}
                    >
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Product Meta & Action Section ──────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div>
                {product.categoryName && (
                  <span className="text-luxury-gold text-xs sm:text-sm font-semibold tracking-wider uppercase bg-luxury-gold/10 px-3 py-1 rounded-full border border-luxury-gold/30 inline-block mb-3">
                    {product.categoryName}
                  </span>
                )}

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
                  {product.title || product.name}
                </h1>

                {/* Prices */}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-luxury-gold font-mono">
                    {formatPrice(productPrice)}
                  </span>
                  {originalPrice && hasDiscount && (
                    <span className="text-gray-500 text-lg sm:text-xl line-through font-mono">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Short Description */}
                {product.short_description && (
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed mt-4">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Installment Widget (Tabby/Tamara Concept) - Hidden temporarily */}
              {false && (
                <div className="bg-luxury-dark/80 border border-luxury-gold/20 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-luxury-gold/15 flex items-center justify-center text-luxury-gold flex-shrink-0 border border-luxury-gold/30">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-xs sm:text-sm font-bold">
                        أو قسّم فاتورتك على 4 دفعات ميسرة
                      </p>
                      <p className="text-luxury-gold text-xs font-mono font-bold mt-0.5">
                        بقيمة {installmentAmount} ر.س / شهرياً بدون أي فوائد أو رسوم
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div className="bg-luxury-dark border border-luxury-gold/30 p-5 sm:p-7 rounded-2xl space-y-5 shadow-2xl">
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm sm:text-base">الكمية المطلوبة:</span>
                  <div className="flex items-center bg-luxury-black border border-luxury-gold/30 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors text-base font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-white font-mono font-bold text-base">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors text-base font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all text-base sm:text-lg flex items-center justify-center gap-2 active:scale-98 shadow-xl"
                  >
                    {isAdding ? (
                      <>
                        <svg className="w-5 h-5 text-luxury-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>تمت الإضافة للسلة</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>أضف للسلة</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-4 px-6 border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black font-extrabold rounded-xl transition-all text-base sm:text-lg flex items-center justify-center gap-2 active:scale-98"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>شراء سريع ومباشر</span>
                  </button>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 pt-1 border-t border-luxury-gold/15">
                  {product.stock_status === 'in_stock' || product.stock > 0 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      متوفر في المستودع وجاهز للشحن الفوري
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-2 h-2 bg-red-400 rounded-full" />
                      غير متوفر في المخزون حالياً
                    </span>
                  )}
                </div>
              </div>

              {/* ── Value Propositions & Guarantees ────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-luxury-dark/60 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <strong className="text-white block">شحن سريع 24-72 ساعة</strong>
                    <span className="text-gray-400">توصيل لباب بيتك بكافة المدن</span>
                  </div>
                </div>

                <div className="bg-luxury-dark/60 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <strong className="text-white block">الضمان الذهبي</strong>
                    <span className="text-gray-400">استبدال واسترجاع فوري لراحتك</span>
                  </div>
                </div>

                <div className="bg-luxury-dark/60 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a1 1 0 001 1h14a1 1 0 001-1V8H12z" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <strong className="text-white block">تغليف هدايا ملكي</strong>
                    <span className="text-gray-400">متاح مجاناً عند الطلب بالسلة</span>
                  </div>
                </div>

                <div className="bg-luxury-dark/60 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-xs">
                    <strong className="text-white block">شحن مجاني</strong>
                    <span className="text-gray-400">تلقائياً للطلبات فوق 250 ر.س</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-8 pt-6 border-t border-luxury-gold/20">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    تفاصيل ومكونات المنتج
                  </h3>
                  <div
                    className="text-gray-300 leading-relaxed prose prose-invert prose-gold max-w-none text-sm sm:text-base"
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
  const mapped = products.map((p) => ({
    id: p.id,
    title: p.title,
    short_description: p.short_description || '',
    slug: p.slug,
    price: p.price,
    sale_price: p.sale_price || undefined,
    image: p.image,
    created_at: p.created_at,
  }));

  return (
    <section className="py-12 sm:py-20 bg-luxury-dark/60 border-t border-luxury-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">منتجات يفضلها عشاق هذه الرائحة</h2>
          <p className="text-gray-400 text-xs sm:text-sm">تشكيلة حصرية مختارة لتكمل روعة تجربتك</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {mapped.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
