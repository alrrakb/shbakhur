'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x400/1a1a1a/D4AF37?text=No+Image';

export default function CartPage() {
  const { showToast } = useToast();
  const { items, removeItem, updateQuantity, totalPrice, appliedDiscount, setAppliedDiscount } = useCart();
  const [showCoupon, setShowCoupon] = useState(Boolean(appliedDiscount));
  const [couponText, setCouponText] = useState(appliedDiscount?.code || '');
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

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
          value: data.value
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
  
  const discountValue = totalPrice - calculateTotalAfterDiscount();

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      
      <div className="pt-32 pb-16">
        {/* Cart Content */}
        <section className="py-16 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6 text-luxury-gold/30">🛒</div>
                <h2 className="text-2xl font-bold text-white mb-4">سلتك فارغة</h2>
                <p className="text-gray-400 mb-8">لم تقم بإضافة أي منتجات بعد</p>
                <Link
                  href="/products"
                  className="inline-block px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
                >
                 تصفح المنتجات
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="bg-luxury-dark border border-luxury-gold/20 rounded-sm p-4 flex items-center gap-4"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={item.image && item.image !== '' ? item.image : PLACEHOLDER_IMAGE}
                          alt={item.name || 'Product'}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-luxury-gold font-bold">
                          {item.price} ر.س
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold hover:text-black transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-left">
                        <p className="text-luxury-gold font-bold">
                          {item.price * item.quantity} ر.س
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Coupon Section */}
                <div className="bg-luxury-dark border border-luxury-gold/30 rounded-sm p-6 mt-8 space-y-4">
                  <button 
                    onClick={() => setShowCoupon(!showCoupon)}
                    className="flex justify-between items-center w-full text-white font-medium hover:text-luxury-gold transition-colors"
                  >
                    <span>هل لديك كوبون خصم؟</span>
                    <svg className={`w-5 h-5 transform transition-transform duration-300 ${showCoupon ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="flex gap-2 pt-4">
                          <input
                            type="text"
                            value={couponText}
                            onChange={(e) => setCouponText(e.target.value)}
                            placeholder="أدخل رمز الكوبون"
                            className={`flex-1 bg-luxury-black border ${couponError ? 'border-red-500' : 'border-luxury-gold/20'} rounded-sm px-4 py-3 text-white focus:outline-none focus:border-luxury-gold transition-colors uppercase`}
                            disabled={Boolean(appliedDiscount)}
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={!couponText.trim() || Boolean(appliedDiscount) || checkingCoupon}
                            className={`px-6 py-3 font-bold rounded-sm transition-colors disabled:opacity-50 ${
                              Boolean(appliedDiscount) 
                                ? 'bg-green-500 text-white cursor-not-allowed' 
                                : 'bg-luxury-gold text-luxury-black hover:bg-luxury-gold-light'
                            }`}
                          >
                            {appliedDiscount ? 'تم التطبيق ✓' : checkingCoupon ? 'جاري الفحص...' : 'تطبيق'}
                          </button>
                        </div>
                        {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
                        {appliedDiscount && (
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-green-500 font-medium">تم تطبيق خصم بقيمة {discountValue.toFixed(0)} ر.س بنجاح.</p>
                            <button 
                              onClick={() => { setAppliedDiscount(null); setCouponText(''); }}
                              className="text-xs text-red-400 hover:underline"
                            >
                              إزالة الكوبون
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Total */}
                <div className="bg-luxury-dark border border-luxury-gold/30 rounded-sm p-6 mt-4">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>المجموع الفرعي</span>
                      <span>{totalPrice} ر.س</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex items-center justify-between text-green-400">
                        <span>الخصم ({appliedDiscount.code})</span>
                        <span>-{discountValue.toFixed(0)} ر.س</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-luxury-gold/20">
                      <span className="text-white text-lg font-bold">الإجمالي النهائي</span>
                      <span className="text-luxury-gold font-bold text-3xl">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/checkout"
                      className="flex-1 text-center px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
                    >
                      متابعة الشراء
                    </Link>
                    <Link
                      href="/"
                      className="flex-1 text-center px-8 py-4 border border-luxury-gold/30 text-white font-bold rounded-sm hover:bg-luxury-gold/10 transition-colors"
                    >
                      مواصلة التسوق
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  );
}
