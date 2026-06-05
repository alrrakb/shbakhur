'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { createOrder } from '@/lib/database';

interface PendingCheckout {
  formData: {
    name: string; phone: string; additionalPhone: string;
    street: string; area: string; address: string; notes: string;
  };
  orderItems: { product_id: string | number; product_name: string; quantity: number; price: number; image?: string }[];
  discountValue: number;
  totalAfterDiscount: number;
}

type TransferForm = { senderName: string; senderBank: string; senderAccount: string };

// ── Validation ────────────────────────────────────────────────────────────────
const NAME_REGEX    = /^[؀-ۿa-zA-Z\s]{3,60}$/;
const ACCOUNT_REGEX = /^[a-zA-Z0-9]{5,34}$/;

function validateField(field: keyof TransferForm, value: string): string {
  switch (field) {
    case 'senderName':
      if (!value.trim()) return 'اسم صاحب الحساب مطلوب';
      if (value.trim().length < 3) return 'الاسم يجب أن يكون 3 أحرف على الأقل';
      if (value.trim().length > 60) return 'الاسم لا يتجاوز 60 حرفاً';
      if (!NAME_REGEX.test(value.trim())) return 'الاسم يجب أن يحتوي على حروف فقط';
      return '';
    case 'senderBank':
      if (!value.trim()) return 'اسم البنك مطلوب';
      if (value.trim().length < 2) return 'يرجى إدخال اسم البنك بشكل صحيح';
      if (value.trim().length > 60) return 'اسم البنك لا يتجاوز 60 حرفاً';
      return '';
    case 'senderAccount':
      if (!value.trim()) return 'رقم الحساب مطلوب';
      if (value.trim().length < 5) return 'رقم الحساب يجب أن يكون 5 أحرف على الأقل';
      if (value.trim().length > 34) return 'رقم الحساب لا يتجاوز 34 خانة';
      if (!ACCOUNT_REGEX.test(value.trim())) return 'رقم الحساب يجب أن يحتوي على أحرف وأرقام إنجليزية فقط';
      return '';
    default:
      return '';
  }
}

// ── Dev fake data ─────────────────────────────────────────────────────────────
const FAKE_TRANSFERS: TransferForm[] = [
  { senderName: 'Ahmed Mohammed Al-Otaibi', senderBank: 'البنك الأهلي السعودي',    senderAccount: 'SA1234567890123456789012' },
  { senderName: 'Khalid Saad Al-Qahtani',   senderBank: 'مصرف الراجحي',            senderAccount: 'SA9876543210987654321098' },
  { senderName: 'Faisal Omar Al-Zahrani',   senderBank: 'بنك الرياض',               senderAccount: 'SA0011223344556677889900' },
];

export default function BankTransferPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router         = useRouter();
  const { showToast }  = useToast();
  const isNewOrder     = resolvedParams.orderId === 'new';
  const isDev          = process.env.NODE_ENV === 'development';

  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [checkoutError, setCheckoutError]     = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const [formData, setFormData] = useState<TransferForm>({ senderName: '', senderBank: '', senderAccount: '' });
  const [errors, setErrors]     = useState<Partial<Record<keyof TransferForm, string>>>({});
  const [touched, setTouched]   = useState<Partial<Record<keyof TransferForm, boolean>>>({});

  const bankDetails = {
    accountName:   'مؤسسة طلائع الركب للتسويق الالكتروني',
    accountNumber: '215608010987718',
    iban:          'SA9280000215608010987718',
  };

  useEffect(() => {
    if (isNewOrder) {
      const stored = sessionStorage.getItem('pendingCheckout');
      if (!stored) { setCheckoutError(true); return; }
      try { setPendingCheckout(JSON.parse(stored)); }
      catch { setCheckoutError(true); }
    }
  }, [isNewOrder]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleChange = (field: keyof TransferForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleBlur = (field: keyof TransferForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const validateAll = (): boolean => {
    const fields: (keyof TransferForm)[] = ['senderName', 'senderBank', 'senderAccount'];
    const newErrors: Partial<Record<keyof TransferForm, string>> = {};
    const newTouched: Partial<Record<keyof TransferForm, boolean>> = {};
    fields.forEach(f => {
      newTouched[f] = true;
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fillFakeData = () => {
    const profile = FAKE_TRANSFERS[Math.floor(Math.random() * FAKE_TRANSFERS.length)];
    setFormData(profile);
    setErrors({});
    setTouched({});
  };

  const fieldClass = (field: keyof TransferForm) => {
    const base = 'w-full bg-luxury-black border rounded px-4 py-3 text-white focus:outline-none transition-colors';
    if (touched[field] && errors[field])               return `${base} border-red-500 focus:border-red-400`;
    if (touched[field] && !errors[field] && formData[field]) return `${base} border-green-500/60 focus:border-green-400`;
    return `${base} border-luxury-gold/20 focus:border-luxury-gold`;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      let finalOrderId     = resolvedParams.orderId;
      let finalOrderNumber = '';

      if (isNewOrder) {
        if (!pendingCheckout) throw new Error('لا توجد بيانات الطلب');
        const { formData: fd, orderItems, discountValue } = pendingCheckout;

        const result = await createOrder({
          customer_name:    fd.name,
          customer_phone:   fd.phone,
          customer_area:    fd.area,
          customer_street:  fd.address ? `${fd.street || ''} (${fd.address})`.trim() : fd.street,
          additional_phone: fd.additionalPhone || undefined,
          notes:            fd.notes || undefined,
          discount_amount:  discountValue,
          payment_method:   'bank_transfer',
          items:            orderItems,
        });

        if (!result.success || !result.order_id)
          throw new Error(result.error || 'فشل إنشاء الطلب');

        finalOrderId     = result.order_id;
        finalOrderNumber = result.order_number || '';
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ sender_name: formData.senderName, sender_bank: formData.senderBank, sender_account: formData.senderAccount })
        .eq('id', finalOrderId);

      if (updateError) throw updateError;

      // إشعار تيليجرام
      if (isNewOrder && pendingCheckout) {
        const { formData: fd, orderItems, discountValue, totalAfterDiscount } = pendingCheckout;
        fetch('/api/notify-telegram', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number:   finalOrderNumber,
            customer_name:  fd.name,
            customer_phone: fd.phone,
            additional_phone: fd.additionalPhone || undefined,
            area:    fd.area,
            address: `${fd.street ? fd.street + ' - ' : ''}${fd.address}`,
            notes:   fd.notes || undefined,
            payment_method: 'bank_transfer',
            sender_name:    formData.senderName,
            sender_bank:    formData.senderBank,
            sender_account: formData.senderAccount,
            items:    orderItems.map(i => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
            subtotal: orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
            discount: discountValue,
            total:    totalAfterDiscount,
          }),
        }).catch(err => console.error('Telegram notify failed:', err));
      }

      if (isNewOrder) sessionStorage.removeItem('pendingCheckout');
      router.push(`/checkout/success/${finalOrderId}`);

    } catch (error) {
      console.error('Error submitting payment:', error);
      showToast('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.', 'error');
      setIsSubmitting(false);
    }
  };

  // ── Error screen ─────────────────────────────────────────────────────────────
  if (checkoutError) {
    return (
      <main className="min-h-screen bg-luxury-black">
        <Header />
        <div className="pt-32">
          <section className="py-20 text-center">
            <div className="text-6xl mb-6 text-luxury-gold/30">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">انتهت جلسة الدفع</h2>
            <p className="text-gray-400 mb-6">يرجى العودة وإعادة ملء بيانات الطلب.</p>
            <a href="/checkout" className="px-6 py-3 bg-luxury-gold text-luxury-black font-bold rounded-sm hover:bg-luxury-gold-light transition-colors">
              العودة للدفع
            </a>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
        <section className="py-8 sm:py-12 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">تأكيد الدفع</h1>
            {!isNewOrder && (
              <p className="text-gray-400 mb-2 text-sm sm:text-base">
                رقم الطلب: <span className="text-luxury-gold font-bold">{resolvedParams.orderId.slice(-6).toUpperCase()}</span>
              </p>
            )}
            <p className="text-gray-400 text-sm sm:text-base">الرجاء إتمام التحويل البنكي لحساب المؤسسة ثم تعبئة بيانات التحويل.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* ── بطاقة بيانات البنك ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-luxury-dark rounded-xl overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.1)] border border-luxury-gold/30 sticky top-32 h-fit relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

              <div className="bg-luxury-black/50 p-6 flex justify-between items-center text-white border-b border-luxury-gold/20">
                <h3 className="text-2xl font-bold text-luxury-gold">مصرف الراجحي</h3>
                <div className="w-12 h-12 bg-luxury-gold/10 border border-luxury-gold/30 rounded-md flex items-center justify-center">
                  <svg className="w-8 h-8 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>

              <div className="p-5 sm:p-8 text-white text-center relative z-10">
                <h2 className="text-lg sm:text-2xl font-bold mb-5 sm:mb-8 text-white">{bankDetails.accountName}</h2>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between border-b pb-4 border-luxury-gold/20 gap-1">
                    <span className="font-bold text-gray-400">رقم الحساب:</span>
                    <span className="font-mono tracking-wider text-luxury-gold text-sm sm:text-base">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between pt-2 gap-1">
                    <span className="font-bold text-gray-400">الآيبان:</span>
                    <span className="font-mono tracking-wider text-sm sm:text-lg text-luxury-gold break-all">{bankDetails.iban}</span>
                  </div>
                </div>

                {pendingCheckout && (
                  <div className="mt-6 pt-4 border-t border-luxury-gold/20">
                    <div className="text-gray-400 text-sm mb-1">المبلغ المطلوب تحويله:</div>
                    <div className="text-luxury-gold font-bold text-2xl">{pendingCheckout.totalAfterDiscount.toFixed(0)} ر.س</div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── نموذج بيانات التحويل ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>

              {/* زر التعبئة التجريبية */}
              {isDev && (
                <button type="button" onClick={fillFakeData}
                  className="w-full mb-4 py-2.5 rounded-sm border border-dashed border-purple-500/60 bg-purple-500/10 text-purple-300 text-sm font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  تعبئة بيانات تجريبية (وضع التطوير فقط)
                </button>
              )}

              <form onSubmit={handleSubmit} noValidate
                className="bg-luxury-dark border border-luxury-gold/20 rounded-xl p-5 sm:p-8 space-y-5">
                <h3 className="text-xl font-bold text-luxury-gold border-b border-luxury-gold/20 pb-4">بيانات التحويل المرسل</h3>

                {/* اسم صاحب الحساب */}
                <div>
                  <label className="block text-white mb-2">
                    اسم صاحب الحساب <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={formData.senderName} maxLength={60}
                    onChange={e => handleChange('senderName', e.target.value)}
                    onBlur={() => handleBlur('senderName')}
                    className={fieldClass('senderName')}
                    placeholder="مثال: أحمد محمد عبد الله"
                    autoComplete="name"
                  />
                  {touched.senderName && errors.senderName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {errors.senderName}
                    </p>
                  )}
                </div>

                {/* اسم البنك */}
                <div>
                  <label className="block text-white mb-2">
                    اسم البنك <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={formData.senderBank} maxLength={60}
                    onChange={e => handleChange('senderBank', e.target.value)}
                    onBlur={() => handleBlur('senderBank')}
                    className={fieldClass('senderBank')}
                    placeholder="مثال: البنك الأهلي، مصرف الإنماء..."
                  />
                  {touched.senderBank && errors.senderBank && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {errors.senderBank}
                    </p>
                  )}
                </div>

                {/* رقم الحساب */}
                <div>
                  <label className="block text-white mb-2">
                    رقم الحساب / الآيبان <span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={formData.senderAccount} maxLength={34}
                    onChange={e => handleChange('senderAccount', e.target.value.replace(/\s/g, '').toUpperCase())}
                    onBlur={() => handleBlur('senderAccount')}
                    className={`${fieldClass('senderAccount')} font-mono`}
                    placeholder="SAxxxxxxxxxxxxxxxxxxxxxxxxx أو رقم الحساب"
                    dir="ltr"
                    inputMode="text"
                    autoComplete="off"
                  />
                  {touched.senderAccount && errors.senderAccount && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                      {errors.senderAccount}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">يُقبل: آيبان سعودي (SA + 22 رقم) أو رقم حساب عادي</p>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting || (isNewOrder && !pendingCheckout)}
                    className="w-full bg-luxury-gold text-luxury-black font-bold py-4 rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <><div className="w-5 h-5 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin" />جاري الإرسال وتأكيد الطلب...</>
                    ) : 'تأكيد بيانات التحويل وإتمام الطلب'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
