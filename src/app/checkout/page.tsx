'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { createOrder } from '@/lib/database';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  const { items, totalPrice, clearCart, appliedDiscount } = useCart();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
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

      const result = await createOrder({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_area: formData.area,
        customer_street: formData.address ? `${formData.street || ''} (${formData.address})`.trim() : formData.street,
        additional_phone: formData.additionalPhone,
        notes: formData.notes,
        discount_amount: discountValue,
        items: orderItems
      });

      if (result.success) {
        setOrderNumber(result.order_number || null);
        clearCart();
        setIsModalOpen(false);
        showToast('تم تقديم طلبك بنجاح!', 'success');
      } else {
        showToast('حدث خطأ في تقديم الطلب', 'error');
      }
    } catch (error) {
      console.error('Order error:', error);
      showToast('حدث خطأ في تقديم الطلب', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (orderNumber) {
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <section className="py-20 text-center">
            <div className="w-24 h-24 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-luxury-gold">
              <svg className="w-12 h-12 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-luxury-gold mb-6">تم استلام طلبك بنجاح!</h2>
            <p className="text-gray-300 text-lg mb-4">شكرًا لتسوقك من SH للبخور. سنقوم بالتواصل معك قريباً لتأكيد الطلب.</p>
            <div className="inline-block bg-luxury-dark border border-luxury-gold/30 rounded-sm px-8 py-4 mb-6">
              <p className="text-gray-400 mb-1">رقم الطلب الخاص بك</p>
              <p className="text-3xl font-bold text-white tracking-wider">{orderNumber}</p>
            </div>
            
            <div className="max-w-md mx-auto mb-8 bg-[#1a1a1a] border-r-4 border-green-500 rounded-sm p-4 text-right">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-white font-bold mb-1">تنبيه هام</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">لأي استفسار عن الطلبية أو تعديلها، يرجى التواصل معنا عبر الواتساب مع كتابة (رقم الطلب) لخدمتكم بشكل أسرع.</p>
                </div>
              </div>
            </div>

            <div>
              <Link href="/products" className="inline-block px-8 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors">
                متابعة التسوق
              </Link>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

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
      
      <div className="pt-32 pb-16">
        {/* Checkout Content */}
        <section className="py-12 relative z-10">
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
            <form onSubmit={handleSubmit} className="bg-luxury-dark border border-luxury-gold/20 rounded-sm p-6 space-y-6">
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
                  <span className="text-gray-300 font-bold">المجموع النهائي</span>
                  <span className="text-luxury-gold font-bold text-2xl">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span>
                </div>

                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors"
                >
                  إتمام الشراء
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
              className="bg-luxury-dark border border-luxury-gold/30 rounded-sm p-8 max-w-md w-full text-center"
            >
              <div className="w-16 h-16 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">تأكيد الطلب</h3>
              
              <div className="text-gray-400 space-y-3 mb-8 text-center">
                <p>سيتم حفظ طلبك وإرساله لفريقنا لمعالجته.</p>
                <p>المبلغ الإجمالي المطلق: <span className="text-luxury-gold font-bold">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span></p>
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
                  {isLoading ? 'جاري المعالجة...' : 'التأكيد والإرسال'}
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
