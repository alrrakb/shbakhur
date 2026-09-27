'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { createOrder, getShippingSettings, type ShippingSettings, DEFAULT_SHIPPING_SETTINGS } from '@/lib/database';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CityCombobox from '@/components/CityCombobox';
import {
  validateName,
  validateSaudiPhone,
  validateCity,
  validateDistrict,
  validateStreet,
  validateAddressDetails,
  validateNotes,
} from '@/lib/validation';

export interface FormData {
  name: string;
  phone: string;
  additionalPhone: string;
  city: string;
  area: string; // District / الحي
  street: string;
  address: string; // House / Apartment / Building details
  notes: string;
}

// ── Dev fake data with authentic Saudi details ───────────────────────────────
const FAKE_PROFILES: FormData[] = [
  {
    name: 'عبدالله محمد العمري',
    phone: '0501487293',
    additionalPhone: '0559384726',
    city: 'الرياض',
    area: 'حي النرجس',
    street: 'شارع الأمير محمد بن سلمان',
    address: 'فيلا 14، بجوار مسجد التقوى',
    notes: 'الرجاء الاتصال قبل التوصيل بـ 30 دقيقة',
  },
  {
    name: 'سارة خالد الغامدي',
    phone: '0552849173',
    additionalPhone: '',
    city: 'جدة',
    area: 'حي الروضة',
    street: 'شارع الكيال',
    address: 'شقة 7، الطابق الثالث، عمارة الياسمين',
    notes: '',
  },
  {
    name: 'فيصل سعد الشهري',
    phone: '0538194726',
    additionalPhone: '0506381924',
    city: 'الدمام',
    area: 'حي الشاطئ',
    street: 'طريق الخليج العربي',
    address: 'مجمع الأندلس السكني، مبنى B',
    notes: 'التوصيل متاح في الفترة المسائية',
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, appliedDiscount, giftOptions } = useCart();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer'>('bank_transfer');
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);

  useEffect(() => {
    getShippingSettings()
      .then(setShippingSettings)
      .catch(() => setShippingSettings(DEFAULT_SHIPPING_SETTINGS));
  }, []);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    additionalPhone: '',
    city: '',
    area: '',
    street: '',
    address: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // ── Restore saved form data if available ─────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('sh-checkout-form');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved form data:', e);
      }
    }
  }, []);

  const isDev = process.env.NODE_ENV === 'development';
  const isTest = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // ── Calculation ─────────────────────────────────────────────────────────────
  const calculateTotalAfterDiscount = () => {
    if (!appliedDiscount) return totalPrice;
    const disc =
      appliedDiscount.type === 'percentage'
        ? (totalPrice * appliedDiscount.value) / 100
        : appliedDiscount.value;
    return Math.max(0, totalPrice - disc);
  };

  const totalAfterDiscount = calculateTotalAfterDiscount();
  const discountValue = totalPrice - totalAfterDiscount;
  
  // Free shipping logic
  const isFreeShipping = shippingSettings.free_shipping_enabled && totalAfterDiscount >= shippingSettings.free_shipping_threshold;
  const effectiveShippingCost = isFreeShipping ? 0 : shippingSettings.fee;
  const grandTotal = totalAfterDiscount + effectiveShippingCost;

  // ── Validation dispatcher ───────────────────────────────────────────────────
  const validateSingleField = (field: keyof FormData, value: string, currentData: FormData = formData): string => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'phone':
        return validateSaudiPhone(value, true);
      case 'additionalPhone':
        return validateSaudiPhone(value, false, currentData.phone);
      case 'city':
        return validateCity(value);
      case 'area':
        return validateDistrict(value);
      case 'street':
        return validateStreet(value);
      case 'address':
        return validateAddressDetails(value);
      case 'notes':
        return validateNotes(value);
      default:
        return '';
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    localStorage.setItem('sh-checkout-form', JSON.stringify(updated));

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateSingleField(field, value, updated) }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateSingleField(field, formData[field], formData) }));
  };

  const validateAll = () => {
    const fields: (keyof FormData)[] = [
      'name',
      'phone',
      'additionalPhone',
      'city',
      'area',
      'street',
      'address',
      'notes',
    ];
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const newTouched: Partial<Record<keyof FormData, boolean>> = {};

    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateSingleField(f, formData[f], formData);
      if (err) newErrors[f] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAll()) {
      setIsModalOpen(true);
    } else {
      showToast('يرجى مراجعة الحقول وتصحيح الأخطاء المشار إليها بالأحمر', 'error');
    }
  };

  const fillFakeData = () => {
    const profile = FAKE_PROFILES[Math.floor(Math.random() * FAKE_PROFILES.length)];
    setFormData(profile);
    localStorage.setItem('sh-checkout-form', JSON.stringify(profile));
    setErrors({});
    setTouched({});
  };

  const fieldClass = (field: keyof FormData) => {
    const base = 'w-full px-4 py-3 bg-luxury-black border rounded-xl text-white text-sm focus:outline-none transition-all duration-200';
    if (touched[field] && errors[field]) {
      return `${base} border-red-500/80 bg-red-950/10 focus:border-red-400`;
    }
    if (touched[field] && !errors[field] && formData[field]) {
      return `${base} border-emerald-500/60 bg-emerald-950/10 focus:border-emerald-400`;
    }
    return `${base} border-luxury-gold/30 hover:border-luxury-gold/60 focus:border-luxury-gold`;
  };

  // ── Order Confirmation ──────────────────────────────────────────────────────
  const handleConfirmOrder = async () => {
    setIsLoading(true);
    try {
      const orderItems = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
      }));

      const fullStreetDetails = [formData.street, formData.address].filter(Boolean).join(' - ');

      let orderNotes = formData.notes || '';
      if (giftOptions.isGift) {
        const giftExtra = `[طلب إهداء فاخر: المهدى إليه: ${giftOptions.recipientName || 'غير محدد'} | الرسالة: ${giftOptions.giftMessage || 'بدون رسالة'}]`;
        orderNotes = orderNotes ? `${orderNotes}\n${giftExtra}` : giftExtra;
      }

      if (paymentMethod === 'cod') {
        const result = await createOrder({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_city: formData.city,
          customer_area: formData.area,
          customer_street: fullStreetDetails,
          additional_phone: formData.additionalPhone || undefined,
          notes: orderNotes || undefined,
          discount_amount: discountValue,
          shipping_cost: effectiveShippingCost,
          payment_method: 'cod',
          is_test: isTest,
          items: orderItems,
        });

        if (result.success && result.order_id) {
          const notifyPayload = {
            order_number: result.order_number,
            customer_name: formData.name,
            customer_phone: formData.phone,
            additional_phone: formData.additionalPhone || undefined,
            city: formData.city,
            area: formData.area,
            address: fullStreetDetails,
            notes: orderNotes || undefined,
            payment_method: 'cod' as const,
            items: orderItems.map((i) => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
            subtotal: totalPrice,
            discount: discountValue,
            shipping: effectiveShippingCost,
            total: grandTotal,
          };

          fetch('/api/notify-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifyPayload),
          }).catch((err) => console.error('Telegram notify failed:', err));

          fetch('/api/notify-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifyPayload),
          }).catch((err) => console.error('WhatsApp notify failed:', err));

          setIsModalOpen(false);
          clearCart();
          localStorage.removeItem('sh-checkout-form');
          router.push(`/checkout/success/${result.order_id}`);
        } else {
          showToast('حدث خطأ في تسجيل الطلب، يرجى المحاولة لاحقاً', 'error');
        }
      } else {
        // Direct Bank Transfer: Store checkout payload in session storage
        // NOTE: We DO NOT clearCart() here so if user goes back to edit, the cart is intact!
        const checkoutData = {
          formData: {
            ...formData,
            notes: orderNotes,
          },
          orderItems,
          discountValue,
          shippingCost: effectiveShippingCost,
          totalAfterDiscount,
          is_test: isTest,
        };
        sessionStorage.setItem('pendingCheckout', JSON.stringify(checkoutData));
        setIsModalOpen(false);
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
      <main className="min-h-screen bg-luxury-black text-gray-100 flex flex-col justify-between">
        <Header />
        <div className="pt-32 pb-20">
          <section className="py-20 text-center max-w-lg mx-auto px-4">
            <div className="w-20 h-20 bg-luxury-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 text-luxury-gold border border-luxury-gold/30">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">سلتك فارغة حالياً</h2>
            <p className="text-gray-400 mb-8 text-sm">أضف بعض المنتجات إلى سلتك أولاً لإتمام عملية الشراء.</p>
            <Link
              href="/products"
              className="inline-block px-8 py-3.5 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light transition-all shadow-lg"
            >
              تصفح المنتجات الآن
            </Link>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-luxury-black text-right flex flex-col justify-between" dir="rtl">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20">
        <section className="py-6 sm:py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* ── Top Bar: Back Link & Visual Checkout Progress Stepper ──── */}
            <div className="mb-8 max-w-4xl mx-auto">
              {/* Back to Cart Action */}
              <div className="mb-5 flex items-center justify-between">
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm text-luxury-gold hover:text-luxury-gold-light transition-colors group px-3 py-1.5 rounded-lg border border-luxury-gold/20 hover:border-luxury-gold/50 bg-luxury-dark/60"
                >
                  <svg className="w-4 h-4 rtl:rotate-180 text-luxury-gold group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>العودة لسلة المشتريات</span>
                </Link>

                <span className="text-xs text-gray-400 hidden sm:inline">
                  الخطوة 2 من 3
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center justify-between relative max-w-xl mx-auto">
                <div className="w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-luxury-gold/20 -z-0" />
                
                {/* Step 1: Cart */}
                <Link href="/cart" className="flex flex-col items-center gap-1.5 relative z-10 group">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center text-xs font-bold shadow-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-luxury-gold transition-colors">السلة</span>
                </Link>

                {/* Step 2: Shipping & Details */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className="w-9 h-9 rounded-full bg-luxury-gold border-2 border-luxury-gold text-luxury-black flex items-center justify-center text-xs font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                    2
                  </div>
                  <span className="text-xs text-luxury-gold font-bold">العنوان والتوصيل</span>
                </div>

                {/* Step 3: Payment */}
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className="w-9 h-9 rounded-full bg-luxury-dark border-2 border-luxury-gold/30 text-gray-400 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-xs text-gray-400">الدفع والتأكيد</span>
                </div>
              </div>
            </div>

            {/* Dev helper */}
            {isDev && (
              <div className="max-w-7xl mx-auto mb-6">
                <button
                  type="button"
                  onClick={fillFakeData}
                  className="w-full py-2.5 rounded-xl border border-dashed border-purple-500/60 bg-purple-500/10 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>تعبئة بيانات تجريبية سعودية دقيقة (وضع التطوير)</span>
                </button>
              </div>
            )}

            {/* ── 2-Column Luxury Layout ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* ── Right Column (Main Form & Payment) ────────────────────── */}
              <div className="lg:col-span-7 space-y-6">

                {/* Top Assurance Banner */}
                <div className="bg-gradient-to-r from-luxury-dark via-[#1a1711] to-luxury-dark border border-luxury-gold/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                  <div className="w-10 h-10 rounded-xl bg-luxury-gold/15 flex items-center justify-center text-luxury-gold flex-shrink-0 border border-luxury-gold/30">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">شحن وتوصيل رسمي لكافة مدن ومناطق المملكة</p>
                    <p className="text-gray-400 text-xs mt-0.5">تصلك شحنتك مغلفة بعناية ملكية ومحمية بضمان سلامة وصول العطور</p>
                  </div>
                </div>

                {/* Form Wrapper */}
                <form onSubmit={handleSubmit} noValidate className="space-y-6">

                  {/* Section 1: Customer Contact Info */}
                  <div className="bg-luxury-dark border border-luxury-gold/25 rounded-2xl p-5 sm:p-7 shadow-xl">
                    <h3 className="text-luxury-gold font-bold text-base mb-5 flex items-center gap-2 border-b border-luxury-gold/15 pb-3">
                      <span className="w-7 h-7 rounded-full bg-luxury-gold/15 flex items-center justify-center text-xs text-luxury-gold font-bold">1</span>
                      بيانات العميل والتواصل
                    </h3>

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                          الاسم الكامل (الاسم الأول واسم العائلة) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          onBlur={() => handleBlur('name')}
                          maxLength={60}
                          className={fieldClass('name')}
                          placeholder="مثال: تركي محمد العتيبي"
                          autoComplete="name"
                        />
                        {touched.name && errors.name ? (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.name}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-[11px] mt-1">يُرجى كتابة الاسم ثنائياً أو ثلاثياً بدون اختصارات</p>
                        )}
                      </div>

                      {/* Phones Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Primary Phone */}
                        <div>
                          <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                            رقم الجوال (واتساب للتوصيل) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                            onBlur={() => handleBlur('phone')}
                            maxLength={10}
                            className={fieldClass('phone')}
                            placeholder="05XXXXXXXX"
                            dir="ltr"
                            inputMode="numeric"
                          />
                          {touched.phone && errors.phone ? (
                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.phone}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-[11px] mt-1">يبدأ بـ 05 ومكون من 10 أرقام</p>
                          )}
                        </div>

                        {/* Additional Phone */}
                        <div>
                          <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                            رقم جوال بديل <span className="text-gray-500 font-normal text-xs">(اختياري)</span>
                          </label>
                          <input
                            type="tel"
                            value={formData.additionalPhone}
                            onChange={(e) => handleChange('additionalPhone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                            onBlur={() => handleBlur('additionalPhone')}
                            maxLength={10}
                            className={fieldClass('additionalPhone')}
                            placeholder="05XXXXXXXX"
                            dir="ltr"
                            inputMode="numeric"
                          />
                          {touched.additionalPhone && errors.additionalPhone && (
                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.additionalPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Delivery & Shipping Address */}
                  <div className="bg-luxury-dark border border-luxury-gold/25 rounded-2xl p-5 sm:p-7 shadow-xl">
                    <h3 className="text-luxury-gold font-bold text-base mb-5 flex items-center gap-2 border-b border-luxury-gold/15 pb-3">
                      <span className="w-7 h-7 rounded-full bg-luxury-gold/15 flex items-center justify-center text-xs text-luxury-gold font-bold">2</span>
                      عنوان الشحن والتسليم
                    </h3>

                    <div className="space-y-4">
                      {/* City & District */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                            المدينة <span className="text-red-400">*</span>
                          </label>
                          <CityCombobox
                            value={formData.city}
                            onChange={(city) => handleChange('city', city)}
                            onBlur={() => handleBlur('city')}
                            error={errors.city}
                            touched={touched.city}
                          />
                          {touched.city && errors.city && (
                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.city}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                            الحي <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.area}
                            onChange={(e) => handleChange('area', e.target.value)}
                            onBlur={() => handleBlur('area')}
                            maxLength={60}
                            className={fieldClass('area')}
                            placeholder="مثال: حي النرجس / حي الملقا"
                          />
                          {touched.area && errors.area && (
                            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.area}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Street */}
                      <div>
                        <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                          اسم الشارع أو المعلم القريب <span className="text-gray-500 font-normal text-xs">(اختياري)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.street}
                          onChange={(e) => handleChange('street', e.target.value)}
                          onBlur={() => handleBlur('street')}
                          maxLength={100}
                          className={fieldClass('street')}
                          placeholder="مثال: شارع أنس بن مالك أو بالقرب من مجمع..."
                        />
                      </div>

                      {/* Detailed Address */}
                      <div>
                        <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                          تفاصيل العنوان ورقم المبنى / الشقة <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleChange('address', e.target.value)}
                          onBlur={() => handleBlur('address')}
                          maxLength={200}
                          className={fieldClass('address')}
                          placeholder="مثال: فيلا 18 أو عمارة الصفا، شقة 5، الطابق الثاني"
                        />
                        {touched.address && errors.address ? (
                          <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.address}
                          </p>
                        ) : (
                          <p className="text-gray-500 text-[11px] mt-1">يساعد مندوب الشحن على توصيل الطلب لباب بيتك بدقة</p>
                        )}
                      </div>

                      {/* Delivery Notes */}
                      <div>
                        <label className="block text-white font-medium mb-1.5 text-xs sm:text-sm">
                          تعليمات وملاحظات إضافية للتوصيل <span className="text-gray-500 font-normal text-xs">(اختياري)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={formData.notes}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          onBlur={() => handleBlur('notes')}
                          maxLength={500}
                          className={`${fieldClass('notes')} resize-none`}
                          placeholder="مثال: يرجى التواصل عبر الواتساب قبل الوصول أو التوصيل بعد الساعة 4 عصراً..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Payment Method */}
                  <div className="bg-luxury-dark border border-luxury-gold/25 rounded-2xl p-5 sm:p-7 shadow-xl">
                    <h3 className="text-luxury-gold font-bold text-base mb-5 flex items-center gap-2 border-b border-luxury-gold/15 pb-3">
                      <span className="w-7 h-7 rounded-full bg-luxury-gold/15 flex items-center justify-center text-xs text-luxury-gold font-bold">3</span>
                      طريقة الدفع المعتمدة
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Bank Transfer */}
                      <div
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMethod === 'bank_transfer'
                            ? 'border-luxury-gold bg-luxury-gold/10 shadow-lg shadow-luxury-gold/10'
                            : 'border-luxury-gold/20 bg-luxury-black/70 hover:border-luxury-gold/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'border-luxury-gold' : 'border-gray-500'}`}>
                              {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 rounded-full bg-luxury-gold" />}
                            </div>
                            <span className="text-white font-bold text-sm">التحويل البنكي المباشر</span>
                          </div>
                          <span className="text-xs font-semibold text-luxury-gold bg-luxury-gold/10 px-2 py-0.5 rounded border border-luxury-gold/30">
                            مصرف الراجحي
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs pr-6">
                          تحويل آمن ومباشر لحساب المؤسسة مع إرفاق الإيصال في الخطوة التالية.
                        </p>
                      </div>

                      {/* Cash on Delivery (COD) */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMethod === 'cod'
                            ? 'border-luxury-gold bg-luxury-gold/10 shadow-lg shadow-luxury-gold/10'
                            : 'border-luxury-gold/20 bg-luxury-black/70 hover:border-luxury-gold/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-luxury-gold' : 'border-gray-500'}`}>
                              {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-luxury-gold" />}
                            </div>
                            <span className="text-white font-bold text-sm">الدفع عند الاستلام (COD)</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                            نقداً أو مدى
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs pr-6">
                          ادفع للمندوب عند استلام شحنتك ومعاينتها أمام باب بيتك.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit CTA with Clean SVG Arrow */}
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold text-base sm:text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.99]"
                  >
                    <span>{paymentMethod === 'cod' ? 'إتمام الطلب والدفع عند الاستلام' : 'متابعة وتأكيد بيانات التحويل البنكي'}</span>
                    <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>

              </div>

              {/* ── Left Column (Sticky Order Summary) ────────────────────── */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">

                <div className="bg-luxury-dark border border-luxury-gold/30 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-luxury-gold/20 pb-4 mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>ملخص المشتريات</span>
                    </h2>
                    <Link href="/cart" className="text-xs text-luxury-gold hover:underline">
                      تعديل السلة
                    </Link>
                  </div>

                  {/* Mini Item List */}
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1 mb-5 divide-y divide-luxury-gold/10">
                    {items.map((item) => (
                      <div key={item.id} className="pt-2.5 first:pt-0 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-luxury-black border border-luxury-gold/20 overflow-hidden flex-shrink-0">
                          <img
                            src={item.image || 'https://placehold.co/100x100/1a1a1a/D4AF37?text=Product'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-xs font-semibold line-clamp-1">{item.name}</h4>
                          <p className="text-gray-400 text-[11px]">الكمية: {item.quantity} × {item.price} ر.س</p>
                        </div>
                        <span className="text-luxury-gold font-mono font-bold text-xs">
                          {item.price * item.quantity} ر.س
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Gift info tag if selected */}
                  {giftOptions.isGift && (
                    <div className="mb-4 p-2.5 bg-luxury-gold/10 border border-luxury-gold/30 rounded-xl flex items-center gap-2 text-xs text-luxury-gold">
                      <svg className="w-4 h-4 text-luxury-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0H4v13a1 1 0 001 1h14a1 1 0 001-1V8H12z" />
                      </svg>
                      <span>يتضمن كرت إهداء وتغليف فاخر:</span>
                      <strong className="text-white">{giftOptions.recipientName || 'شخص عزيز'}</strong>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="space-y-2.5 text-xs sm:text-sm border-t border-luxury-gold/15 pt-4 mb-5">
                    <div className="flex justify-between text-gray-300">
                      <span>المجموع الفرعي ({items.reduce((s, i) => s + i.quantity, 0)} قطع):</span>
                      <span className="font-mono text-white font-semibold">{totalPrice.toFixed(0)} ر.س</span>
                    </div>

                    {appliedDiscount && (
                      <div className="flex justify-between text-emerald-400">
                        <span>الخصم ({appliedDiscount.code}):</span>
                        <span className="font-mono font-semibold">-{discountValue.toFixed(0)} ر.س</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-gray-300">
                      <span>رسوم الشحن والتوصيل:</span>
                      {isFreeShipping ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-xs">
                          شحن مجاني
                        </span>
                      ) : (
                        <span className="font-mono text-white font-semibold">{effectiveShippingCost.toFixed(0)} ر.س</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-luxury-gold/30">
                      <div>
                        <span className="text-white text-base font-bold block">المبلغ الإجمالي:</span>
                        <span className="text-[10px] text-gray-400">شامل ضريبة القيمة المضافة والشحن</span>
                      </div>
                      <span className="text-luxury-gold font-bold text-2xl font-mono">
                        {grandTotal.toFixed(0)} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Security Guarantees */}
                  <div className="pt-4 border-t border-luxury-gold/15 space-y-2.5 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>عملية شراء آمنة ومحمية بتشفير 256-bit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>معالجة وشحن فوري للطلبية خلال ساعات العمل</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>
      </div>

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-luxury-dark border border-luxury-gold/40 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center mx-2 shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-luxury-gold/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-luxury-gold/40 text-luxury-gold">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-1">مراجعة وتأكيد الطلب</h3>
              <p className="text-xs text-gray-400 mb-4">يرجى التأكد من صحة البيانات قبل الاعتماد النهائي</p>

              <div className="bg-luxury-black/80 border border-luxury-gold/25 rounded-xl p-4 text-right text-xs space-y-2 mb-5 text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">الاسم:</span>
                  <span className="text-white font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">الجوال:</span>
                  <span className="text-white font-mono font-medium" dir="ltr">{formData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">المدينة والحي:</span>
                  <span className="text-luxury-gold font-medium">{formData.city} - {formData.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">طريقة الدفع:</span>
                  <span className="text-white font-medium">
                    {paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'التحويل البنكي المباشر'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-luxury-gold/20 pt-2 mt-2">
                  <span className="text-gray-400 font-bold">المبلغ الإجمالي المطلوب:</span>
                  <span className="text-luxury-gold font-bold text-sm font-mono">{grandTotal.toFixed(0)} ر.س</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-luxury-gold/30 text-white font-semibold rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light transition-colors disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      جاري الاعتماد...
                    </>
                  ) : (
                    'تأكيد الطلب الآن'
                  )}
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
