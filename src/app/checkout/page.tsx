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

// ── Validation rules ──────────────────────────────────────────────────────────
const PHONE_REGEX = /^05[0-9]{8}$/;
const NAME_REGEX  = /^[؀-ۿa-zA-Z\s]{3,60}$/;

function validateField(field: keyof FormData, value: string): string {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'الاسم الكامل مطلوب';
      if (value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
      if (value.trim().length > 60) return 'الاسم يجب ألا يتجاوز 60 حرفاً';
      if (!NAME_REGEX.test(value.trim())) return 'الاسم يجب أن يحتوي على حروف عربية أو إنجليزية فقط';
      return '';
    case 'phone':
      if (!value.trim()) return 'رقم الجوال مطلوب';
      if (!PHONE_REGEX.test(value.trim())) return 'رقم الجوال يجب أن يبدأ بـ 05 ويكون 10 أرقام (مثال: 05XXXXXXXX)';
      return '';
    case 'additionalPhone':
      if (!value.trim()) return '';
      if (!PHONE_REGEX.test(value.trim())) return 'رقم الجوال الإضافي يجب أن يبدأ بـ 05 ويكون 10 أرقام';
      return '';
    case 'area':
      if (!value.trim()) return 'المنطقة / الحي مطلوب';
      if (value.trim().length < 2) return 'يرجى إدخال اسم الحي بشكل صحيح';
      if (value.trim().length > 100) return 'لا يتجاوز 100 حرف';
      return '';
    case 'address':
      if (!value.trim()) return 'رقم المنزل / الشقة مطلوب';
      if (value.trim().length < 2) return 'يرجى إدخال تفاصيل العنوان';
      if (value.trim().length > 200) return 'لا يتجاوز 200 حرف';
      return '';
    case 'street':
      if (value.length > 100) return 'لا يتجاوز 100 حرف';
      return '';
    case 'notes':
      if (value.length > 500) return 'لا يتجاوز 500 حرف';
      return '';
    default:
      return '';
  }
}

// ── Dev fake data ─────────────────────────────────────────────────────────────
const FAKE_PROFILES: FormData[] = [
  {
    name: 'عبدالله محمد العمري',
    phone: '0501234567',
    additionalPhone: '0559876543',
    street: 'شارع الأمير محمد بن عبدالعزيز',
    area: 'حي النرجس',
    address: 'فيلا 12، الطابق الأرضي',
    notes: 'الرجاء الاتصال قبل التوصيل بـ 30 دقيقة',
  },
  {
    name: 'سارة خالد الغامدي',
    phone: '0551112233',
    additionalPhone: '',
    street: 'شارع التحلية',
    area: 'حي الملقا',
    address: 'شقة 7، الطابق الثالث، عمارة الياسمين',
    notes: '',
  },
  {
    name: 'فيصل سعد الشهري',
    phone: '0534445566',
    additionalPhone: '0507778899',
    street: 'طريق الملك عبدالعزيز',
    area: 'حي العارض',
    address: 'دور 2، شقة 15',
    notes: 'لا توصيل بعد العاشرة مساءً',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, appliedDiscount } = useCart();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('bank_transfer');

  const [formData, setFormData] = useState<FormData>({
    name: '', phone: '', additionalPhone: '',
    street: '', area: '', address: '', notes: '',
  });
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const isDev   = process.env.NODE_ENV === 'development';
  const isTest  = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const calculateTotalAfterDiscount = () => {
    if (!appliedDiscount) return totalPrice;
    const disc = appliedDiscount.type === 'percentage'
      ? (totalPrice * appliedDiscount.value) / 100
      : appliedDiscount.value;
    return Math.max(0, totalPrice - disc);
  };
  const discountValue = totalPrice - calculateTotalAfterDiscount();

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const validateAll = () => {
    const fields: (keyof FormData)[] = ['name','phone','additionalPhone','street','area','address','notes'];
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const newTouched: Partial<Record<keyof FormData, boolean>> = {};
    fields.forEach(f => {
      newTouched[f] = true;
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) setIsModalOpen(true);
  };

  const fillFakeData = () => {
    const profile = FAKE_PROFILES[Math.floor(Math.random() * FAKE_PROFILES.length)];
    setFormData(profile);
    setErrors({});
    setTouched({});
  };

  // ── Field border helper ──────────────────────────────────────────────────────
  const fieldClass = (field: keyof FormData) => {
    const base = 'w-full px-4 py-3 bg-luxury-black border rounded-sm text-white focus:outline-none transition-colors';
    if (touched[field] && errors[field])  return `${base} border-red-500 focus:border-red-400`;
    if (touched[field] && !errors[field] && formData[field]) return `${base} border-green-500/60 focus:border-green-400`;
    return `${base} border-luxury-gold/20 focus:border-luxury-gold`;
  };

  // ── Order items ───────────────────────────────────────────────────────────────
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
        const result = await createOrder({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_area: formData.area,
          customer_street: formData.address
            ? `${formData.street || ''} (${formData.address})`.trim()
            : formData.street,
          additional_phone: formData.additionalPhone || undefined,
          notes: formData.notes || undefined,
          discount_amount: discountValue,
          payment_method: 'cod',
          is_test: isTest,
          items: orderItems,
        });

        if (result.success && result.order_id) {
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
              items: orderItems.map(i => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
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
        const checkoutData = {
          formData,
          orderItems,
          discountValue,
          totalAfterDiscount: calculateTotalAfterDiscount(),
          is_test: isTest,
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
            <Link href="/products" className="text-luxury-gold hover:underline">تصفح المنتجات</Link>
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
            <div className="bg-luxury-gold/10 border border-luxury-gold/30 rounded-sm p-4 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-luxury-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-luxury-gold font-bold">التوصيل متاح للرياض فقط</p>
                <p className="text-gray-400 text-sm">نقدم خدمة التوصيل داخل مدينة الرياض فقط</p>
              </div>
            </div>

            {/* Dev autofill button */}
            {isDev && (
              <button
                type="button"
                onClick={fillFakeData}
                className="w-full mb-4 py-2.5 rounded-sm border border-dashed border-purple-500/60 bg-purple-500/10 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                تعبئة بيانات تجريبية (وضع التطوير فقط)
              </button>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="bg-luxury-dark border border-luxury-gold/20 rounded-sm p-4 sm:p-6 space-y-5">

              {/* الاسم الكامل */}
              <div>
                <label className="block text-white font-medium mb-2">
                  الاسم الكامل <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  maxLength={60}
                  className={fieldClass('name')}
                  placeholder="أدخل اسمك الكامل"
                  autoComplete="name"
                />
                {touched.name && errors.name && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* رقم الجوال */}
              <div>
                <label className="block text-white font-medium mb-2">
                  رقم الجوال <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  onBlur={() => handleBlur('phone')}
                  maxLength={10}
                  className={fieldClass('phone')}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  autoComplete="tel"
                  inputMode="numeric"
                />
                {touched.phone && errors.phone && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {errors.phone}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">يجب أن يبدأ بـ 05 ويكون 10 أرقام</p>
              </div>

              {/* رقم جوال إضافي */}
              <div>
                <label className="block text-white font-medium mb-2">رقم جوال إضافي <span className="text-gray-500 text-sm font-normal">(اختياري)</span></label>
                <input
                  type="tel"
                  value={formData.additionalPhone}
                  onChange={e => handleChange('additionalPhone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  onBlur={() => handleBlur('additionalPhone')}
                  maxLength={10}
                  className={fieldClass('additionalPhone')}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  inputMode="numeric"
                />
                {touched.additionalPhone && errors.additionalPhone && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {errors.additionalPhone}
                  </p>
                )}
              </div>

              {/* الشارع */}
              <div>
                <label className="block text-white font-medium mb-2">الشارع <span className="text-gray-500 text-sm font-normal">(اختياري)</span></label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={e => handleChange('street', e.target.value)}
                  onBlur={() => handleBlur('street')}
                  maxLength={100}
                  className={fieldClass('street')}
                  placeholder="مثال: شارع الملك فهد"
                  autoComplete="street-address"
                />
                {touched.street && errors.street && (
                  <p className="text-red-400 text-xs mt-1">{errors.street}</p>
                )}
              </div>

              {/* المنطقة */}
              <div>
                <label className="block text-white font-medium mb-2">
                  المنطقة (الحي) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={e => handleChange('area', e.target.value)}
                  onBlur={() => handleBlur('area')}
                  maxLength={100}
                  className={fieldClass('area')}
                  placeholder="مثال: حي النرجس"
                />
                {touched.area && errors.area && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {errors.area}
                  </p>
                )}
              </div>

              {/* رقم المنزل */}
              <div>
                <label className="block text-white font-medium mb-2">
                  رقم المنزل / الشقة <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  maxLength={200}
                  className={fieldClass('address')}
                  placeholder="مثال: شقة 3، الطابق الأول"
                />
                {touched.address && errors.address && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                    {errors.address}
                  </p>
                )}
              </div>

              {/* ملاحظات */}
              <div>
                <label className="block text-white font-medium mb-2">
                  ملاحظات إضافية <span className="text-gray-500 text-sm font-normal">(اختياري)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => handleChange('notes', e.target.value)}
                  onBlur={() => handleBlur('notes')}
                  maxLength={500}
                  className={`${fieldClass('notes')} min-h-[90px] resize-y`}
                  placeholder="أي ملاحظات إضافية أو تعليمات للتوصيل..."
                />
                <div className="flex justify-between items-center mt-1">
                  {touched.notes && errors.notes
                    ? <p className="text-red-400 text-xs">{errors.notes}</p>
                    : <span />}
                  <span className={`text-xs ${formData.notes.length > 450 ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {formData.notes.length}/500
                  </span>
                </div>
              </div>

              {/* ── طريقة الدفع ──────────────────────────────────────────── */}
              <div className="border-t border-luxury-gold/20 pt-6">
                <label className="block text-white font-bold mb-4 text-lg">طريقة الدفع <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* COD */}
                  <button type="button" onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-right ${
                      paymentMethod === 'cod'
                        ? 'border-luxury-gold bg-luxury-gold/10'
                        : 'border-luxury-gold/20 bg-luxury-black hover:border-luxury-gold/50'
                    }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-luxury-gold' : 'border-gray-500'}`}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-luxury-gold" />}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">الدفع عند الاستلام</div>
                      <div className="text-gray-400 text-xs mt-0.5">ادفع نقداً عند وصول طلبك</div>
                    </div>
                    <svg className="w-8 h-8 text-luxury-gold/60 mr-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>

                  {/* Bank Transfer */}
                  <button type="button" onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-right ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-luxury-gold bg-luxury-gold/10'
                        : 'border-luxury-gold/20 bg-luxury-black hover:border-luxury-gold/50'
                    }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-luxury-gold' : 'border-gray-500'}`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-luxury-gold" />}
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

              {/* ── ملخص الطلب ───────────────────────────────────────────── */}
              <div className="border-t border-luxury-gold/20 pt-6">
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
                <button type="submit"
                  className="w-full px-8 py-4 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors">
                  {paymentMethod === 'cod' ? 'تأكيد الطلب - الدفع عند الاستلام' : 'متابعة للتحويل البنكي'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* ── Modal التأكيد ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-luxury-black/90 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-luxury-dark border border-luxury-gold/30 rounded-sm p-5 sm:p-8 max-w-md w-full text-center mx-2">
              <div className="w-16 h-16 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تأكيد الطلب</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm font-medium bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold">
                {paymentMethod === 'cod' ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>الدفع عند الاستلام</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>التحويل البنكي</>
                )}
              </div>
              <div className="text-gray-400 space-y-2 mb-8">
                <p>المبلغ الإجمالي: <span className="text-luxury-gold font-bold">{calculateTotalAfterDiscount().toFixed(0)} ر.س</span></p>
                <p className="text-sm">
                  {paymentMethod === 'cod'
                    ? 'سيتم تأكيد طلبك فوراً وسيتواصل معك فريقنا قريباً.'
                    : 'ستنتقل لصفحة إتمام التحويل البنكي.'}
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} disabled={isLoading}
                  className="flex-1 px-6 py-3 border border-luxury-gold/30 text-white font-bold rounded-sm hover:bg-luxury-gold/10 transition-colors disabled:opacity-50">
                  إلغاء
                </button>
                <button onClick={handleConfirmOrder} disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50">
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
