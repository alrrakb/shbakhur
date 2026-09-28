'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { getShippingSettings, type ShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/database';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/1a1a1a/D4AF37?text=No+Image';

export default function CartPage() {
  const { showToast } = useToast();
  const {
    items,
    removeItem,
    updateQuantity,
    totalPrice,
    appliedDiscount,
    setAppliedDiscount,
    giftOptions,
    setGiftOptions,
    recentlyRemoved,
    undoRemove,
    addItem,
  } = useCart();

  const [showCoupon, setShowCoupon] = useState(Boolean(appliedDiscount));
  const [couponText, setCouponText] = useState(appliedDiscount?.code || '');
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(giftOptions.isGift);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

  // ── Load Shipping Settings ───────────────────────────────────────────────────
  useEffect(() => {
    getShippingSettings()
      .then(setShippingSettings)
      .catch(() => setShippingSettings(DEFAULT_SHIPPING_SETTINGS));
  }, []);

  // ── Load Real Products from DB for Intelligent Recommendations ─────────────
  useEffect(() => {
    async function fetchRealRecommendations() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, price, sale_price, image, slug')
          .order('id', { ascending: false })
          .limit(12);

        if (!error && data) {
          setStoreProducts(data);
        }
      } catch (err) {
        console.error('Failed to load recommended products:', err);
      }
    }
    fetchRealRecommendations();
  }, []);

  // Filter recommendations: Products currently not in cart
  const recommendedAddons = storeProducts
    .filter((p) => !items.some((i) => String(i.id) === String(p.id)))
    .slice(0, 4);

  // ── Coupon Logic ─────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponText.trim()) return;
    setCheckingCoupon(true);
    setCouponError('');
    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', couponText.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setCouponError('كود الخصم غير صحيح أو منتهي الصلاحية');
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({
          id: data.id,
          code: data.code,
          type: data.type,
          value: data.value,
        });
        showToast('تم تفعيل كود الخصم بنجاح!', 'success');
      }
    } catch {
      setCouponError('حدث خطأ أثناء فحص الكود');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const calculateTotalAfterDiscount = () => {
    if (!appliedDiscount) return totalPrice;
    let discountAmount = 0;
    if (appliedDiscount.type === 'percentage') {
      discountAmount = (totalPrice * appliedDiscount.value) / 100;
    } else {
      discountAmount = appliedDiscount.value;
    }
    return Math.max(0, totalPrice - discountAmount);
  };

  const totalAfterDiscount = calculateTotalAfterDiscount();
  const discountValue = totalPrice - totalAfterDiscount;

  // ── Free Shipping Progress ───────────────────────────────────────────────────
  const threshold = shippingSettings.free_shipping_threshold;
  const isFreeShipping = shippingSettings.free_shipping_enabled && totalAfterDiscount >= threshold;
  const remainingForFreeShipping = Math.max(0, threshold - totalAfterDiscount);
  const freeShippingProgress = threshold > 0 ? Math.min(100, Math.round((totalAfterDiscount / threshold) * 100)) : 100;

  // ── Quick Add Handler ────────────────────────────────────────────────────────
  const handleQuickAddRealProduct = (product: any) => {
    const unitPrice = parseFloat(product.sale_price || product.price || '0');
    addItem({
      id: product.id,
      name: product.title,
      price: unitPrice,
      image: product.image || PLACEHOLDER_IMAGE,
      quantity: 1,
    });
    showToast(`تمت إضافة "${product.title}" إلى سلتك`, 'success');
  };

  const toggleGiftOption = () => {
    const nextState = !giftOptions.isGift;
    setGiftOptions((prev) => ({ ...prev, isGift: nextState }));
    setShowGiftModal(nextState);
  };

  return (
    <main className="min-h-screen bg-luxury-black text-gray-100 flex flex-col justify-between">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-24 sm:pb-20">
        <section className="py-6 sm:py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Breadcrumb & Title */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-luxury-gold/15 pb-4">
              <div>
                <nav className="text-xs sm:text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Link href="/" className="hover:text-luxury-gold transition-colors">الرئيسية</Link>
                  <span>/</span>
                  <span className="text-luxury-gold">سلة المشتريات</span>
                </nav>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  سلة التسوق الفاخرة
                  {items.length > 0 && (
                    <span className="text-xs sm:text-sm bg-luxury-gold/15 text-luxury-gold px-3 py-1 rounded-full border border-luxury-gold/30 font-medium">
                      {items.reduce((s, i) => s + i.quantity, 0)} قطعة
                    </span>
                  )}
                </h1>
              </div>

              {items.length > 0 && (
                <Link
                  href="/products"
                  className="text-xs sm:text-sm text-luxury-gold hover:text-luxury-gold-light transition-colors flex items-center gap-1.5 self-start sm:self-auto group"
                >
                  <svg className="w-4 h-4 text-luxury-gold group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>استكشاف المزيد من العطور والبخور</span>
                </Link>
              )}
            </div>

            {/* ── Empty Cart State ────────────────────────────────────────── */}
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 sm:py-24 bg-luxury-dark/60 border border-luxury-gold/20 rounded-2xl p-6 sm:p-12 max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
              >
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-luxury-gold/10 border border-luxury-gold/30 rounded-full flex items-center justify-center text-luxury-gold shadow-[0_0_30px_rgba(212,175,55,0.2)]">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">سلتك بانتظار نفحاتك المفضلة</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                  لم تقم بإضافة أي منتج بعد. تصفح تشكيلتنا الحصرية من أجود أنواع العود الملكي، البخور الطبيعي، والمخلطات الشرقية.
                </p>

                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8">
                  <Link
                    href="/products"
                    className="px-6 sm:px-8 py-3.5 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300 text-sm sm:text-base"
                  >
                    تصفح جميع المنتجات
                  </Link>
                  <Link
                    href="/products?category=عود-وبخور"
                    className="px-5 sm:px-6 py-3.5 border border-luxury-gold/40 text-white font-medium rounded-xl hover:bg-luxury-gold/10 transition-colors text-sm sm:text-base"
                  >
                    قسم العود والبخور
                  </Link>
                </div>

                {/* Popular badges */}
                <div className="pt-6 border-t border-luxury-gold/15 flex items-center justify-center gap-6 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="text-luxury-gold">✓</span> عود طبيعي 100%</span>
                  <span className="flex items-center gap-1.5"><span className="text-luxury-gold">✓</span> شحن سريع لكافة المدن</span>
                  <span className="flex items-center gap-1.5"><span className="text-luxury-gold">✓</span> تغليف فاخر ومحمي</span>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* ── Main Cart Content (Right 7 Cols) ──────────────────────── */}
                <div className="lg:col-span-7 space-y-6">

                  {/* Free Shipping Tier Banner */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-luxury-dark via-[#1a1813] to-luxury-dark border border-luxury-gold/30 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isFreeShipping ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-luxury-gold/15 text-luxury-gold border border-luxury-gold/30'}`}>
                          {isFreeShipping ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {isFreeShipping ? (
                              <span className="text-emerald-400 font-bold">تهانينا! طلبيتك مؤهلة للشحن المجاني السريع لكافة مدن المملكة</span>
                            ) : (
                              <span>
                                أضف بـ <strong className="text-luxury-gold font-mono font-bold">{remainingForFreeShipping.toFixed(0)} ر.س</strong> إضافية واحصل على <strong className="text-luxury-gold">شحن مجاني</strong>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {shippingSettings.free_shipping_enabled
                              ? `الشحن المجاني يُطبق تلقائياً على الطلبات من ${threshold} ر.س فأكثر`
                              : `رسوم التوصيل الثابتة ${shippingSettings.fee} ر.س لكافة مناطق المملكة`}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-luxury-gold hidden sm:block">
                        {freeShippingProgress}%
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-2.5 bg-luxury-black/70 rounded-full overflow-hidden border border-luxury-gold/20 p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${freeShippingProgress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFreeShipping
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                            : 'bg-gradient-to-r from-luxury-gold to-luxury-gold-light shadow-[0_0_10px_rgba(212,175,55,0.4)]'
                        }`}
                      />
                    </div>
                  </motion.div>

                  {/* Undo Removal Alert */}
                  <AnimatePresence>
                    {recentlyRemoved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between text-sm text-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>تم حذف &quot;{recentlyRemoved.name}&quot; من سلتك</span>
                        </div>
                        <button
                          onClick={undoRemove}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-lg text-xs font-bold text-amber-300 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          تراجع عن الحذف
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Items List */}
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.25 }}
                          className="bg-luxury-dark/90 hover:bg-luxury-dark border border-luxury-gold/20 hover:border-luxury-gold/40 rounded-xl p-3.5 sm:p-4 transition-all duration-200 shadow-md group"
                        >
                          <div className="flex gap-3 sm:gap-4 items-center">
                            {/* Product Image */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden border border-luxury-gold/20 bg-luxury-black relative">
                              <img
                                src={item.image && item.image !== '' ? item.image : PLACEHOLDER_IMAGE}
                                alt={item.name || 'Product'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-2 hover:text-luxury-gold transition-colors">
                                    {item.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-400">السعر الفردي:</span>
                                    <span className="text-xs sm:text-sm font-semibold text-gray-300 font-mono">
                                      {item.price} ر.س
                                    </span>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      متوفر
                                    </span>
                                  </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="حذف المنتج من السلة"
                                  aria-label="حذف"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>

                              {/* Controls & Subtotal */}
                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-luxury-gold/10">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-1 bg-luxury-black border border-luxury-gold/30 rounded-lg p-1">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-7 h-7 rounded-md text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center justify-center text-sm font-bold active:scale-95"
                                    aria-label="تقليل الكمية"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center text-white font-mono font-bold text-sm">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 rounded-md text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black transition-colors flex items-center justify-center text-sm font-bold active:scale-95"
                                    aria-label="زيادة الكمية"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Line Total */}
                                <div className="text-left">
                                  <span className="text-[11px] text-gray-400 block sm:inline sm:ml-1">المجموع:</span>
                                  <span className="text-luxury-gold font-bold text-base sm:text-lg font-mono">
                                    {item.price * item.quantity} ر.س
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* ── Luxury Gift Packaging & Card Option (Custom Luxury Switch) ── */}
                  <div className="bg-luxury-dark/70 border border-luxury-gold/25 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center justify-between cursor-pointer select-none" onClick={toggleGiftOption}>
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-luxury-gold/15 border border-luxury-gold/30 flex items-center justify-center text-luxury-gold flex-shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a1 1 0 001 1h14a1 1 0 001-1V8H12z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                            هل تود إهداء هذا الطلب لشخص عزيز؟
                            <span className="text-[10px] bg-luxury-gold text-luxury-black px-2 py-0.5 rounded-full font-bold">
                              مجاناً
                            </span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5">
                            نوفر تغليفاً ملكياً فاخراً مع بطاقة إهداء مخصصة ومختومة باسمك
                          </p>
                        </div>
                      </div>

                      {/* Custom Luxury Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={giftOptions.isGift}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGiftOption();
                        }}
                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none flex items-center flex-shrink-0 ${
                          giftOptions.isGift
                            ? 'bg-luxury-gold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                            : 'bg-luxury-black border border-luxury-gold/30'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center text-[10px] ${
                            giftOptions.isGift
                              ? 'bg-luxury-black text-luxury-gold font-bold translate-x-0'
                              : 'bg-gray-400 translate-x-5'
                          }`}
                        >
                          {giftOptions.isGift && '✓'}
                        </div>
                      </button>
                    </div>

                    <AnimatePresence>
                      {(showGiftModal || giftOptions.isGift) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 mt-4 border-t border-luxury-gold/15 space-y-3 overflow-hidden"
                        >
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">اسم المستلم المهدى إليه:</label>
                            <input
                              type="text"
                              value={giftOptions.recipientName}
                              onChange={(e) => setGiftOptions((prev) => ({ ...prev, isGift: true, recipientName: e.target.value }))}
                              placeholder="مثال: الغالي عبدالله / أم محمد"
                              className="w-full bg-luxury-black border border-luxury-gold/30 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-luxury-gold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">رسالة كرت الإهداء المطبوعة:</label>
                            <textarea
                              rows={2}
                              value={giftOptions.giftMessage}
                              onChange={(e) => setGiftOptions((prev) => ({ ...prev, isGift: true, giftMessage: e.target.value }))}
                              placeholder="اكتب عبارة الإهداء اللطيفة التي ترغب بطباعتها داخل الصندوق الملكي..."
                              className="w-full bg-luxury-black border border-luxury-gold/30 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-luxury-gold resize-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── Real Store Products Recommendations ("يكتمل جمال تجربتك مع") ── */}
                  {recommendedAddons.length > 0 && (
                    <div className="bg-luxury-dark/50 border border-luxury-gold/20 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          <div>
                            <h4 className="text-white font-bold text-sm sm:text-base">يكتمل جمال تجربتك مع:</h4>
                            <p className="text-xs text-gray-400 mt-0.5">منتجات مميزة ومختارة من متجرنا لتكمل روعة سلتك</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recommendedAddons.map((product) => {
                          const unitPrice = parseFloat(product.sale_price || product.price || '0');
                          return (
                            <div
                              key={product.id}
                              className="bg-luxury-black/70 border border-luxury-gold/20 hover:border-luxury-gold/40 rounded-xl p-3 flex items-center gap-3 transition-colors group"
                            >
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-luxury-dark flex-shrink-0 border border-luxury-gold/20">
                                <img
                                  src={product.image || PLACEHOLDER_IMAGE}
                                  alt={product.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-white text-xs font-semibold leading-tight line-clamp-1">{product.title}</h5>
                                <p className="text-luxury-gold font-bold text-xs font-mono mt-1">{unitPrice.toFixed(0)} ر.س</p>
                              </div>
                              <button
                                onClick={() => handleQuickAddRealProduct(product)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light hover:shadow-[0_0_10px_rgba(212,175,55,0.3)] flex items-center gap-1 active:scale-95"
                              >
                                <span>+ إضافة</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* ── Order Summary Sidebar (Left 5 Cols) ───────────────────── */}
                <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-28">

                  <div className="bg-luxury-dark border border-luxury-gold/30 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />

                    <h2 className="text-lg sm:text-xl font-bold text-white border-b border-luxury-gold/20 pb-4 mb-5 flex items-center justify-between">
                      <span>ملخص الطلب</span>
                      <span className="text-xs font-normal text-gray-400">({items.length} منتجات)</span>
                    </h2>

                    {/* Coupon Section */}
                    <div className="mb-6">
                      <button
                        onClick={() => setShowCoupon(!showCoupon)}
                        className="flex justify-between items-center w-full text-gray-300 font-medium hover:text-luxury-gold transition-colors text-xs sm:text-sm mb-2"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          هل لديك كوبون خصم؟
                        </span>
                        <svg className={`w-4 h-4 transform transition-transform duration-300 ${showCoupon ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showCoupon && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                value={couponText}
                                onChange={(e) => setCouponText(e.target.value)}
                                placeholder="رمز الكود (مثال: SH10)"
                                className={`flex-1 bg-luxury-black border ${couponError ? 'border-red-500' : 'border-luxury-gold/30'} rounded-xl px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-luxury-gold uppercase font-mono`}
                                disabled={Boolean(appliedDiscount)}
                              />
                              <button
                                onClick={handleApplyCoupon}
                                disabled={!couponText.trim() || Boolean(appliedDiscount) || checkingCoupon}
                                className={`px-4 py-2.5 font-bold rounded-xl transition-colors text-xs sm:text-sm whitespace-nowrap ${
                                  Boolean(appliedDiscount)
                                    ? 'bg-emerald-500 text-white cursor-not-allowed'
                                    : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
                                }`}
                              >
                                {appliedDiscount ? 'مفعّل ✓' : checkingCoupon ? '...' : 'تطبيق'}
                              </button>
                            </div>
                            {couponError && (
                              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {couponError}
                              </p>
                            )}
                            {appliedDiscount && (
                              <div className="flex justify-between items-center mt-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5">
                                <span className="text-xs text-emerald-400 font-medium">تم تطبيق خصم بقيمة {discountValue.toFixed(0)} ر.س ({appliedDiscount.code})</span>
                                <button
                                  onClick={() => { setAppliedDiscount(null); setCouponText(''); }}
                                  className="text-xs text-red-400 hover:text-red-300 underline"
                                >
                                  إلغاء
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Financial Lines */}
                    <div className="space-y-3 text-sm border-t border-luxury-gold/15 pt-4 mb-6">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>المجموع الفرعي:</span>
                        <span className="font-mono text-white font-semibold">{totalPrice.toFixed(0)} ر.س</span>
                      </div>

                      {appliedDiscount && (
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>خصم الكوبون ({appliedDiscount.code}):</span>
                          <span className="font-mono font-semibold">-{discountValue.toFixed(0)} ر.س</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-gray-300">
                        <span>رسوم الشحن والتوصيل:</span>
                        {isFreeShipping ? (
                          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-xs">
                            مجاني
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">تُحدد في صفحة الدفع ({shippingSettings.fee} ر.س)</span>
                        )}
                      </div>

                      {giftOptions.isGift && (
                        <div className="flex items-center justify-between text-luxury-gold text-xs">
                          <span>تغليف إهداء وكرت فاخر:</span>
                          <span className="font-bold">مجاني</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-luxury-gold/30">
                        <div>
                          <span className="text-white text-base sm:text-lg font-bold block">الإجمالي التقريبي:</span>
                          <span className="text-[11px] text-gray-400">شامل ضريبة القيمة المضافة</span>
                        </div>
                        <div className="text-left">
                          <span className="text-luxury-gold font-bold text-2xl sm:text-3xl font-mono block">
                            {totalAfterDiscount.toFixed(0)} ر.س
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-3">
                      <Link
                        href="/checkout"
                        className="w-full flex items-center justify-center gap-2 text-center px-6 py-4 bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold text-base sm:text-lg rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 transform active:scale-98"
                      >
                        <span>متابعة الشراء (الدفع)</span>
                        <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>

                      <Link
                        href="/products"
                        className="w-full block text-center px-4 py-3 border border-luxury-gold/30 text-gray-300 hover:text-luxury-gold font-medium rounded-xl hover:bg-luxury-gold/10 transition-colors text-xs sm:text-sm"
                      >
                        مواصلة التسوق وتصفح المزيد
                      </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-6 pt-5 border-t border-luxury-gold/15 space-y-3 text-xs text-gray-400">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <span><strong>أصالة وجودة مضمونة:</strong> عود طبيعي وبخور فاخر منتقى بعناية فائقة.</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span><strong>شحن سريع ومباشر:</strong> تسليم لباب بيتك خلال 24-72 ساعة لكافة المدن.</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>
        </section>
      </div>

      {/* ── Sticky Mobile Bottom Checkout Bar ────────────────────────────── */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-luxury-black/95 backdrop-blur-md border-t border-luxury-gold/30 px-4 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div>
              <span className="text-[11px] text-gray-400 block">الإجمالي:</span>
              <span className="text-luxury-gold font-bold text-xl font-mono">
                {totalAfterDiscount.toFixed(0)} ر.س
              </span>
              {isFreeShipping && (
                <span className="text-[10px] text-emerald-400 font-bold block">شحن مجاني</span>
              )}
            </div>

            <Link
              href="/checkout"
              className="flex-1 text-center py-3.5 px-5 bg-luxury-gold text-luxury-black font-bold text-sm rounded-xl hover:bg-luxury-gold-light transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>إتمام الطلب (الدفع)</span>
              <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
