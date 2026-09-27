'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/database';

interface PendingCheckout {
  formData: {
    name: string;
    phone: string;
    additionalPhone: string;
    city?: string;
    street: string;
    area: string;
    address: string;
    notes: string;
  };
  orderItems: { product_id: string | number; product_name: string; quantity: number; price: number; image?: string }[];
  discountValue: number;
  shippingCost?: number;
  totalAfterDiscount: number;
  is_test?: boolean;
}

type TransferForm = {
  senderName: string;
  senderBank: string;
  senderAccount: string;
};

// ── Validation ────────────────────────────────────────────────────────────────
const NAME_REGEX = /^[؀-ۿa-zA-Z\s]{3,60}$/;
const ACCOUNT_REGEX = /^[a-zA-Z0-9]{5,34}$/;

function validateField(field: keyof TransferForm, value: string): string {
  switch (field) {
    case 'senderName':
      if (!value.trim()) return 'اسم صاحب الحساب المحول منه مطلوب';
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
      if (!value.trim()) return 'رقم الحساب أو الآيبان مطلوب';
      if (value.trim().length < 5) return 'رقم الحساب يجب أن يكون 5 خانات على الأقل';
      if (value.trim().length > 34) return 'رقم الحساب لا يتجاوز 34 خانة';
      if (!ACCOUNT_REGEX.test(value.trim())) return 'يجب أن يحتوي على أحرف وأرقام إنجليزية فقط';
      return '';
    default:
      return '';
  }
}

// ── Dev fake data ─────────────────────────────────────────────────────────────
const FAKE_TRANSFERS: TransferForm[] = [
  { senderName: 'أحمد محمد العتيبي', senderBank: 'البنك الأهلي السعودي', senderAccount: 'SA1234567890123456789012' },
  { senderName: 'خالد سعد القحطاني', senderBank: 'مصرف الراجحي', senderAccount: '215608010987718' },
  { senderName: 'فيصل عمر الزهراني', senderBank: 'بنك الرياض', senderAccount: 'SA0011223344556677889900' },
];

export default function BankTransferPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { clearCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNewOrder = resolvedParams.orderId === 'new';
  const isDev = process.env.NODE_ENV === 'development';

  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [checkoutError, setCheckoutError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy state feedbacks
  const [copiedField, setCopiedField] = useState<'account' | 'iban' | null>(null);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<TransferForm>({
    senderName: '',
    senderBank: '',
    senderAccount: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TransferForm, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TransferForm, boolean>>>({});

  const bankDetails = {
    bankName: 'مصرف الراجحي',
    accountName: 'مؤسسة طلائع الركب للتسويق الالكتروني',
    accountNumber: '215608010987718',
    iban: 'SA9280000215608010987718',
    whatsapp: '966500000000',
  };

  useEffect(() => {
    if (isNewOrder) {
      const stored = sessionStorage.getItem('pendingCheckout');
      if (!stored) {
        setCheckoutError(true);
        return;
      }
      try {
        setPendingCheckout(JSON.parse(stored));
      } catch {
        setCheckoutError(true);
      }
    }
  }, [isNewOrder]);

  // ── Copy to Clipboard ────────────────────────────────────────────────────────
  const copyToClipboard = (text: string, type: 'account' | 'iban') => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    showToast(`تم نسخ ${type === 'account' ? 'رقم الحساب' : 'الآيبان'} بنجاح!`, 'success');
    setTimeout(() => setCopiedField(null), 3000);
  };

  // ── Receipt File Handler ─────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('حجم الملف يجب ألا يتجاوز 10 ميغابايت', 'error');
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      showToast('تم إرفاق إيصال التحويل بنجاح', 'success');
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Input Handlers ───────────────────────────────────────────────────────────
  const handleChange = (field: keyof TransferForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof TransferForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const validateAll = (): boolean => {
    const fields: (keyof TransferForm)[] = ['senderName', 'senderBank', 'senderAccount'];
    const newErrors: Partial<Record<keyof TransferForm, string>> = {};
    const newTouched: Partial<Record<keyof TransferForm, boolean>> = {};
    fields.forEach((f) => {
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
    const base = 'w-full bg-luxury-black border rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all';
    if (touched[field] && errors[field]) return `${base} border-red-500/80 bg-red-950/10 focus:border-red-400`;
    if (touched[field] && !errors[field] && formData[field]) return `${base} border-emerald-500/60 bg-emerald-950/10 focus:border-emerald-400`;
    return `${base} border-luxury-gold/30 focus:border-luxury-gold hover:border-luxury-gold/60`;
  };

  // Total required amount
  const totalAmount = pendingCheckout
    ? (pendingCheckout.totalAfterDiscount + (pendingCheckout.shippingCost ?? 0)).toFixed(0)
    : '0';

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    setIsSubmitting(true);
    try {
      let finalOrderId = resolvedParams.orderId;
      let finalOrderNumber = '';

      if (isNewOrder) {
        if (!pendingCheckout) throw new Error('لا توجد بيانات الطلب');
        const { formData: fd, orderItems, discountValue } = pendingCheckout;

        const result = await createOrder({
          customer_name: fd.name,
          customer_phone: fd.phone,
          customer_city: fd.city,
          customer_area: fd.area,
          customer_street: [fd.street, fd.address].filter(Boolean).join(' - '),
          additional_phone: fd.additionalPhone || undefined,
          notes: fd.notes || undefined,
          discount_amount: discountValue,
          shipping_cost: pendingCheckout.shippingCost ?? 0,
          payment_method: 'bank_transfer',
          is_test: pendingCheckout.is_test ?? false,
          items: orderItems,
        });

        if (!result.success || !result.order_id) {
          throw new Error(result.error || 'فشل إنشاء الطلب');
        }

        finalOrderId = result.order_id;
        finalOrderNumber = result.order_number || '';
      }

      // Update transfer details on order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          sender_name: formData.senderName,
          sender_bank: formData.senderBank,
          sender_account: formData.senderAccount,
        })
        .eq('id', finalOrderId);

      if (updateError) console.warn('Order metadata update note:', updateError);

      // Send Instant Telegram & WhatsApp Notifications
      if (isNewOrder && pendingCheckout) {
        const { formData: fd, orderItems, discountValue, totalAfterDiscount } = pendingCheckout;
        const shipping = pendingCheckout.shippingCost ?? 0;
        const notifyPayload = {
          order_number: finalOrderNumber,
          customer_name: fd.name,
          customer_phone: fd.phone,
          additional_phone: fd.additionalPhone || undefined,
          city: fd.city,
          area: fd.area,
          address: [fd.street, fd.address].filter(Boolean).join(' - '),
          notes: fd.notes || undefined,
          payment_method: 'bank_transfer' as const,
          sender_name: formData.senderName,
          sender_bank: formData.senderBank,
          sender_account: formData.senderAccount,
          has_receipt_attached: Boolean(receiptFile),
          items: orderItems.map((i) => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
          subtotal: orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
          discount: discountValue,
          shipping,
          total: totalAfterDiscount + shipping,
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
      }

      // Clear cart and temporary checkout data ONLY upon complete success!
      clearCart();
      if (isNewOrder) {
        sessionStorage.removeItem('pendingCheckout');
        localStorage.removeItem('sh-checkout-form');
      }

      showToast('تم تأكيد بيانات التحويل البنكي بنجاح!', 'success');
      router.push(`/checkout/success/${finalOrderId}`);
    } catch (error) {
      console.error('Error submitting payment:', error);
      showToast('حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.', 'error');
      setIsSubmitting(false);
    }
  };

  // ── Session Expired Screen ───────────────────────────────────────────────────
  if (checkoutError) {
    return (
      <main className="min-h-screen bg-luxury-black text-gray-100 flex flex-col justify-between">
        <Header />
        <div className="pt-32 pb-20">
          <section className="py-20 text-center max-w-lg mx-auto px-4">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400 border border-amber-500/30">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">انتهت جلسة تأكيد الدفع</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              يرجى العودة إلى صفحة الدفع لإعادة تأكيد بيانات الطلب والمتابعة.
            </p>
            <Link
              href="/checkout"
              className="inline-block px-8 py-3.5 bg-luxury-gold text-luxury-black font-bold rounded-xl hover:bg-luxury-gold-light transition-colors shadow-lg"
            >
              العودة لصفحة الدفع
            </Link>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-luxury-black text-right flex flex-col justify-between" dir="rtl">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20">
        <section className="py-6 sm:py-10 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Top Bar: Back Link to /checkout */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-luxury-gold hover:text-luxury-gold-light transition-colors group px-3.5 py-2 rounded-xl border border-luxury-gold/20 hover:border-luxury-gold/50 bg-luxury-dark/60 shadow-sm"
            >
              <svg className="w-4 h-4 rtl:rotate-180 text-luxury-gold group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>العودة وتعديل بيانات الطلب</span>
            </Link>

            <span className="text-xs text-gray-400">
              الخطوة الأخيرة (3 من 3)
            </span>
          </div>

          {/* Stepper Header */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-3 text-xs font-semibold bg-luxury-gold/15 border border-luxury-gold/40 text-luxury-gold">
              <svg className="w-4 h-4 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <span>تأكيد التحويل البنكي المباشر</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">بيانات الحساب البنكي وإرفاق الإشعار</h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto">
              قم بالتحويل عبر تطبيق بنكك إلى حساب المؤسسة أدناه، ثم قم بتعبئة بيانات الحوالة وإرفاق الإيصال لتأكيد طلبك فوراً.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── Left Column: Luxury VIP Bank Card (5 Cols) ─────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-5 space-y-6 lg:sticky lg:top-28"
            >
              {/* VIP Card Wrapper */}
              <div className="bg-gradient-to-br from-[#1c1913] via-[#12110e] to-[#0a0a0a] border border-luxury-gold/40 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-luxury-gold/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-luxury-gold/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex justify-between items-center border-b border-luxury-gold/25 pb-4 mb-5">
                  <div>
                    <span className="text-[10px] text-luxury-gold font-bold tracking-widest block uppercase">الحساب الرسمي المعتمد</span>
                    <h3 className="text-xl font-bold text-luxury-gold">{bankDetails.bankName}</h3>
                  </div>
                  <div className="w-12 h-8 rounded-md bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                    <span className="text-[10px] font-mono font-black text-black">CHIP</span>
                  </div>
                </div>

                {/* Account Name */}
                <div className="mb-5">
                  <span className="text-[11px] text-gray-400 block mb-1">اسم المستفيد:</span>
                  <p className="text-sm sm:text-base font-bold text-white leading-snug">{bankDetails.accountName}</p>
                </div>

                {/* Account Number with Copy */}
                <div className="mb-4 bg-luxury-black/70 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-gray-400 block">رقم الحساب:</span>
                    <span className="font-mono font-bold text-luxury-gold text-sm sm:text-base tracking-wider" dir="ltr">
                      {bankDetails.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      copiedField === 'account'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-black border border-luxury-gold/40'
                    }`}
                  >
                    {copiedField === 'account' ? 'تم النسخ ✓' : 'نسخ'}
                  </button>
                </div>

                {/* IBAN with Copy */}
                <div className="mb-5 bg-luxury-black/70 border border-luxury-gold/20 rounded-xl p-3.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-gray-400 block">الآيبان (IBAN):</span>
                    <span className="font-mono font-bold text-luxury-gold text-xs sm:text-sm tracking-wider break-all block" dir="ltr">
                      {bankDetails.iban}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankDetails.iban, 'iban')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                      copiedField === 'iban'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-black border border-luxury-gold/40'
                    }`}
                  >
                    {copiedField === 'iban' ? 'تم النسخ ✓' : 'نسخ'}
                  </button>
                </div>

                {/* Transfer Amount Highlight */}
                <div className="pt-4 border-t border-luxury-gold/25 text-center">
                  <span className="text-xs text-gray-300 block mb-1">المبلغ الإجمالي المطلوب تحويله:</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-luxury-gold font-mono tracking-tight">
                    {totalAmount} <span className="text-lg">ر.س</span>
                  </div>
                  {pendingCheckout && (pendingCheckout.shippingCost ?? 0) === 0 && (
                    <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                      (يتضمن شحن مجاني لكافة مدن المملكة)
                    </span>
                  )}
                </div>
              </div>

              {/* WhatsApp Quick Help Box with Professional SVG */}
              <div className="bg-luxury-dark/80 border border-luxury-gold/20 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.814 3.183 0 5.769-2.587 5.77-5.768 0-3.182-2.588-5.768-5.77-5.768zm3.393 8.163c-.144.405-.837.774-1.17.823-.313.045-.688.064-2.001-.479-1.579-.652-2.573-2.261-2.651-2.366-.079-.105-.639-.851-.639-1.624 0-.773.406-1.155.55-1.311.144-.156.314-.195.419-.195.105 0 .21.002.302.007.097.005.228-.037.356.271.132.318.448 1.092.487 1.171.039.079.066.171.013.276-.052.105-.079.171-.157.263-.078.092-.165.206-.236.276-.079.078-.162.163-.07.321.092.158.409.675.877 1.092.602.536 1.109.702 1.267.781.157.079.25.066.342-.039.092-.105.394-.459.499-.617.105-.158.21-.131.355-.078.144.053.918.433 1.076.512.158.079.263.118.302.184.039.066.039.381-.105.786z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-xs sm:text-sm">تحتاج مساعدة أو تفضل التحويل عبر الواتساب؟</h4>
                  <p className="text-gray-400 text-[11px] mt-0.5">فريق خدمة العملاء جاهز لخدمتك والتحقق فوراً</p>
                </div>
                <a
                  href={`https://wa.me/966500000000?text=${encodeURIComponent(`مرحباً، أود المساعدة في إتمام التحويل البنكي لطلبي بمبلغ ${totalAmount} ر.س`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0 shadow-md"
                >
                  واتساب
                </a>
              </div>
            </motion.div>

            {/* ── Right Column: Transfer Verification Form (7 Cols) ───────── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7"
            >
              {/* Dev Autofill */}
              {isDev && (
                <button
                  type="button"
                  onClick={fillFakeData}
                  className="w-full mb-4 py-2.5 rounded-xl border border-dashed border-purple-500/60 bg-purple-500/10 text-purple-300 text-xs font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>تعبئة بيانات تحويل تجريبية (وضع التطوير)</span>
                </button>
              )}

              <form onSubmit={handleSubmit} noValidate className="bg-luxury-dark border border-luxury-gold/30 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-luxury-gold border-b border-luxury-gold/20 pb-4 flex items-center justify-between">
                  <span>تأكيد بيانات الحوالة البنكية</span>
                  <span className="text-xs font-normal text-gray-400">حقول مطلوبة للتحقق</span>
                </h3>

                {/* Sender Name */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5">
                    اسم صاحب الحساب المحول منه <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    maxLength={60}
                    onChange={(e) => handleChange('senderName', e.target.value)}
                    onBlur={() => handleBlur('senderName')}
                    className={fieldClass('senderName')}
                    placeholder="مثال: أحمد محمد عبد الله"
                    autoComplete="name"
                  />
                  {touched.senderName && errors.senderName ? (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.senderName}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-[11px] mt-1">الاسم كما هو مسجل في تطبيق البنك</p>
                  )}
                </div>

                {/* Sender Bank */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5">
                    اسم البنك المحول منه <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.senderBank}
                    maxLength={60}
                    onChange={(e) => handleChange('senderBank', e.target.value)}
                    onBlur={() => handleBlur('senderBank')}
                    className={fieldClass('senderBank')}
                    placeholder="مثال: مصرف الراجحي / البنك الأهلي / بنك الإنماء..."
                  />
                  {touched.senderBank && errors.senderBank && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.senderBank}
                    </p>
                  )}
                </div>

                {/* Sender Account */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5">
                    رقم الحساب أو الآيبان المحول منه <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.senderAccount}
                    maxLength={34}
                    onChange={(e) => handleChange('senderAccount', e.target.value.replace(/\s/g, '').toUpperCase())}
                    onBlur={() => handleBlur('senderAccount')}
                    className={`${fieldClass('senderAccount')} font-mono`}
                    placeholder="رقم الحساب أو SAxxxxxxxxxxxxxxxxxxxx"
                    dir="ltr"
                    autoComplete="off"
                  />
                  {touched.senderAccount && errors.senderAccount ? (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.senderAccount}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-[11px] mt-1">يُقبل: آيبان سعودي أو آخر 6 أرقام من حسابك</p>
                  )}
                </div>

                {/* ── Receipt Upload Area with Professional SVG ─────────────── */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5">
                    إرفاق إشعار / إيصال التحويل <span className="text-gray-400 font-normal">(اختياري ويسرّع التجهيز)</span>
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-file-input"
                  />

                  {receiptPreview ? (
                    <div className="border border-luxury-gold/30 rounded-xl p-3.5 bg-luxury-black/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-luxury-dark overflow-hidden flex-shrink-0 border border-luxury-gold/20">
                          <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{receiptFile?.name || 'إيصال التحويل'}</p>
                          <span className="text-emerald-400 text-[11px] flex items-center gap-1">✓ جاهز للإرسال</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeReceipt}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="receipt-file-input"
                      className="border-2 border-dashed border-luxury-gold/30 hover:border-luxury-gold/60 rounded-2xl p-5 text-center cursor-pointer bg-luxury-black/50 hover:bg-luxury-gold/5 transition-all flex flex-col items-center justify-center gap-2.5 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-luxury-gold/15 flex items-center justify-center text-luxury-gold group-hover:scale-110 transition-transform border border-luxury-gold/30">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-white">انقر هنا لاختيار صورة إيصال التحويل (PNG, JPG)</p>
                      <span className="text-[11px] text-gray-400">أو يمكنك إرساله لفريقنا عبر الواتساب لاحقاً</span>
                    </label>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || (isNewOrder && !pendingCheckout)}
                    className="w-full bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold py-4 rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base sm:text-lg shadow-xl active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-luxury-black border-t-transparent rounded-full animate-spin" />
                        <span>جاري التحقق وتأكيد الطلبية...</span>
                      </>
                    ) : (
                      <>
                        <span>تأكيد الحوالة وإتمام الطلب نهائياً</span>
                        <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
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
