'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { createOrder } from '@/lib/database';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

interface FormData {
  name: string;
  phone: string;
  additionalPhone: string;
  street: string;
  area: string;
  address: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, appliedDiscount } = useCart();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('bank_transfer');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    additionalPhone: '',
    street: '',
    area: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

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

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = 'الاسم مطلوب';
    if (!formData.phone.trim()) newErrors.phone = 'رقم الجوال مطلوب';
    if (!formData.area.trim()) newErrors.area = 'المنطقة مطلوبة';
    if (!formData.address.trim()) newErrors.address = 'العنوان مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsModalOpen(true);
    }
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);

    try {
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }));

      if (paymentMethod === 'cod') {
        // COD: إنشاء الطلب مباشرة والتحويل لصفحة النجاح
        const result = await createOrder({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_area: formData.area,
          customer_street: formData.address ? `${formData.street || ''} (${formData.address})`.trim() : formData.street,
          additional_phone: formData.additionalPhone,
          notes: formData.notes,
          discount_amount: discountValue,
          payment_method: 'cod',
          items: orderItems,
        });

        if (result.success && result.order_id) {
          // إرسال إشعار تيليجرام (بدون انتظار حتى لا يبطئ التجربة)
          fetch('/api/notify-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_number: result.order_number,
              customer_name: formData.name,
              customer_phone: formData.phone,
              additional_phone: formData.additionalPhone || undefined,
              area: formData.area,
              address: `${formData.street ? formData.street + ' - ' : ''}${formData.address}`,
              notes: formData.notes || undefined,
              payment_method: 'cod',
              items: orderItems.map(i => ({
                product_name: i.product_name,
                quantity: i.quantity,
                price: i.price,
              })),
              subtotal: totalPrice,
              discount: discountValue,
              total: calculateTotalAfterDiscount(),
            }),
          }).catch(err => console.error('Telegram notify failed:', err));

          setIsModalOpen(false);
          clearCart();
          router.push(`/checkout/success/${result.order_id}`);
        } else {
          showToast('حدث خطأ في تقديم الطلب', 'error');
        }
      } else {
        // Bank Transfer: حفظ البيانات في sessionStorage والتحويل لصفحة الدفع
        const checkoutData = {
          formData,
          orderItems,
          discountValue,
          totalAfterDiscount: calculateTotalAfterDiscount(),
        };
        sessionStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
        setIsModalOpen(false);
        clearCart();
        router.push('/checkout/payment/new');
      }
    } catch (error) {
      console.error('Order error:', error);
      showToast('حدث خطأ في تقديم الطلب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <section className="py-20 text-center">
            <div className="text-6xl mb-6 text-luxury-gold/30">🛒</div>
            <h2 className="text-2xl font-bold text-white mb-4">سلتك فارغة</h2>
            <Link href="/products" className="text-luxury-gold hover:underline">
              تصفح المنتجات
            </Link>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
        <section className="py-8 sm:py-12 relative z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Warning */}
            <div className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm p-4 mb-8 flex items-center gap-3">
              <svg className="w-6 h-6 text-luxury-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-luxury-gold font-bold">التوصيل متاح للرياض فقط</p>
                <p className="text-gray-400 text-sm">نقدم خدمة التوصيل داخل مدينة الرياض فقط</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-luxury-dark border border-luxury-gold/20 rounded-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">الاسم الكامل *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 bg-luxury-black border ${errors.name ? 'border-red-500' : 'border-luxury-gold/20'} rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors`}
                  placeholder="أدخل اسمك الكامل"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">رقم الجوال *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 bg-luxury-black border ${errors.phone ? 'border-red-500' : 'border-luxury-gold/20'} rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors`}
                  placeholder="05xxxxxxxx"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">رقم جوال إضافي (اختياري)</label>
                <input
                  type="tel"
                  value={formData.additionalPhone}
                  onChange={(e) => setFormData({ ...formData, additionalPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">الشارع</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors"
                  placeholder="مثال: شارع الملك فهد"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">المنطقة (الحي) *</label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className={`w-full px-4 py-3 bg-luxury-black border ${errors.area ? 'border-red-500' : 'border-luxury-gold/20'} rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors`}
                  placeholder="مثال: حي النرجس"
                />
                {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">رقم المنزل/الشقة *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-3 bg-luxury-black border ${errors.address ? 'border-red-500' : 'border-luxury-gold/20'} rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors`}
                  placeholder="مثال: شقة 3، الطابق الأول"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">تفاصيل إضافية (اختياري)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-luxury-black border border-luxury-gold/20 rounded-sm text-white focus:border-luxury-gold focus:outline-none transition-colors min-h-[100px] resize-y"
                  placeholder="أي ملاحظات إضافية أو تعليمات للتوصيل..."
                />
              </div>

              {/* Payment Method Selection */}
              <div className="border-t border-luxury-gold/20 pt-6">
                <label className="block text-white font-bold mb-4 text-lg">طريقة الدفع *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-right ${
                      paymentMethod === 'cod'
                        ? 'border-luxury-gold bg-luxury-gold/10'
                        : 'border-luxury-gold/20 bg-luxury-black hover:border-luxury-gold/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-luxury-gold' : 'border-gray-500'
                    }`}>
                      {paymentMethod === 'cod' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-luxury-gold" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">الدفع عند الاستلام</div>
                      <div className="text-gray-400 text-xs mt-0.5">ادفع نقداً عند وصول طلبك</div>
                    </div>
                    <svg className="w-8 h-8 text-luxury-gold/60 mr-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>

                  {/* Bank Transfer Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-right ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-luxury-gold bg-luxury-gold/10'
                        : 'border-luxury-gold/20 bg-luxury-black hover:border-luxury-gold/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      paymentMethod === 'bank_transfer' ? 'border-luxury-gold' : 'border-gray-500'
                    }`}>
                      {paymentMethod === 'bank_transfer' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-luxury-gold" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">التحويل البنكي</div>
                      <div className="text-gray-400 text-xs mt-0.5">حوّل المبلغ وأرفق الإيصال</div>
                    </div>
                    <svg className="w-8 h-8 text-luxury-gold/60 mr-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-luxury-gold/20 pt-6 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">المجموع الفرعي</span>
                  <span className="text-white font-bold">{totalPrice} ر.س</span>
                </div>

                {appliedDiscount && (
                  <div className="flex items-center justify-between mb-2 text-green-400">
                    <span>الخصم ({appliedDiscount.code})</span>
                    <span>-{discountValue.toFixed(0)} ر.س</span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6 pt-4 border-t border-luxury-gold/10">
                  <span className="text-gray-300 font-bold text-sm sm:text-base">المجموع النهائي</span>
                  <span className="text-luxury-gold font-bold text-xl sm:text-2xl">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
                >
                  {paymentMethod === 'cod' ? 'تأكيد الطلب - الدفع عند الاستلام' : 'متابعة للتحويل البنكي'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-luxury-black/90 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-luxury-dark border border-luxury-gold/30 rounded-sm p-5 sm:p-8 max-w-md w-full text-center mx-2"
            >
              <div className="w-16 h-16 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-2">تأكيد الطلب</h3>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm font-medium
                bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold">
                {paymentMethod === 'cod' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    الدفع عند الاستلام
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    التحويل البنكي
                  </>
                )}
              </div>

              <div className="text-gray-400 space-y-2 mb-8 text-center">
                <p>المبلغ الإجمالي: <span className="text-luxury-gold font-bold">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span></p>
                {paymentMethod === 'cod' ? (
                  <p className="text-sm">سيتم تأكيد طلبك فوراً وسيتواصل معك فريقنا قريباً.</p>
                ) : (
                  <p className="text-sm">ستنتقل لصفحة إتمام التحويل البنكي وإرفاق الإيصال.</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border border-luxury-gold/30 text-white font-bold rounded-sm hover:bg-luxury-gold/10 transition-colors disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'جاري المعالجة...' : 'تأكيد'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
