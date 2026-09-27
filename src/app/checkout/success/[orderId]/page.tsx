'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import InvoiceModal from '@/components/InvoiceModal';
import InvoiceTemplate, { type InvoiceOrder } from '@/components/InvoiceTemplate';

export default function CheckoutSuccess({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [orderData, setOrderData] = useState<InvoiceOrder | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  const orderShortId = resolvedParams.orderId.length > 8
    ? resolvedParams.orderId.slice(-6).toUpperCase()
    : resolvedParams.orderId.toUpperCase();

  const fullOrderRef = `SH-${orderShortId}`;

  // ── Fetch Full Order Details for Official Tax Invoice ────────────────────────
  useEffect(() => {
    async function loadOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id, order_number, status, subtotal, discount_amount, shipping_cost, total_amount, notes, created_at, payment_method,
            customers(name, phone, additional_phone, city, address),
            order_items(id, product_name, quantity, unit_price, total_price)
          `)
          .eq('id', resolvedParams.orderId)
          .maybeSingle();

        if (!error && data) {
          setOrderData(data as unknown as InvoiceOrder);
        }
      } catch (err) {
        console.error('Error fetching order for invoice:', err);
      }
    }
    loadOrder();
  }, [resolvedParams.orderId]);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(fullOrderRef);
    setCopied(true);
    showToast('تم نسخ رقم الطلب بنجاح!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  // ── Direct Official Invoice Print Handler ────────────────────────────────────
  const handlePrintOfficialInvoice = () => {
    if (!orderData) {
      setShowInvoiceModal(true);
      return;
    }

    const el = invoicePrintRef.current;
    if (!el) {
      setShowInvoiceModal(true);
      return;
    }

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      setShowInvoiceModal(true);
      return;
    }

    const title = `فاتورة_ضريبية_${orderData.order_number || fullOrderRef}`;

    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; }
    @media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
    @page { margin: 0; size: A4; }
    body { padding: 10mm; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    win.document.close();
    win.addEventListener('load', () => setTimeout(() => { win.focus(); win.print(); }, 600));
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً، قمت للتو بالطلب من متجركم برقم الطلب (${fullOrderRef})، وأود متابعة تفاصيل الشحن والتجهيز. شكراً لكم!`
  );

  return (
    <main className="min-h-screen bg-luxury-black text-gray-100 flex flex-col justify-between" dir="rtl">
      <Header />

      <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24">
        <section className="py-8 sm:py-16 text-center relative z-10 px-4 max-w-3xl mx-auto">

          {/* Celebratory Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-luxury-dark rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 border-2 border-luxury-gold shadow-[0_0_40px_rgba(212,175,55,0.3)] relative"
          >
            <div className="absolute inset-0 rounded-full border border-luxury-gold/40 animate-ping opacity-25" />
            <svg className="w-12 h-12 sm:w-14 sm:h-14 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl sm:text-4xl font-extrabold text-luxury-gold mb-3 sm:mb-4 tracking-wide"
          >
            تهانينا! تم استلام وتأكيد طلبك بنجاح
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-gray-300 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed"
          >
            شكرًا لاختيارك <strong className="text-white">متجر SH للبخور والعطور الفاخرة</strong>. تم إرسال إشعار فوري لفريق التجهيز للبدء في إعداد طلبيتك بعناية ملكية وتغليف فاخر.
          </motion.p>

          {/* Order ID Card with 1-Click Copy */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-luxury-dark border border-luxury-gold/40 rounded-2xl px-6 sm:px-10 py-5 sm:py-6 mb-8 max-w-md mx-auto shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-gray-400 mb-1 text-xs sm:text-sm font-medium">رقم مرجع الطلبية الخاص بك</p>
            
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest" dir="ltr">
                {fullOrderRef}
              </span>
              <button
                onClick={copyOrderNumber}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  copied
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-luxury-gold/20 hover:bg-luxury-gold text-luxury-gold hover:text-black border border-luxury-gold/40'
                }`}
              >
                {copied ? 'تم النسخ ✓' : 'نسخ'}
              </button>
            </div>
          </motion.div>

          {/* ── Order Lifecycle Stepper ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-luxury-dark/80 border border-luxury-gold/25 rounded-2xl p-5 sm:p-7 mb-8 text-right shadow-xl"
          >
            <h3 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2 border-b border-luxury-gold/15 pb-3">
              <svg className="w-5 h-5 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>مراحل تجهيز وتسليم طلبيتك:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-luxury-black/60 border border-emerald-500/40 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold border border-emerald-500/30">
                  ✓
                </div>
                <h4 className="text-white text-xs font-bold">تم استلام الطلب</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">مسجل بنظام المتجر</p>
              </div>

              <div className="bg-luxury-black/60 border border-luxury-gold/40 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-luxury-gold/20 text-luxury-gold flex items-center justify-center mx-auto mb-2 text-xs font-bold border border-luxury-gold/40 animate-pulse">
                  2
                </div>
                <h4 className="text-luxury-gold text-xs font-bold">التجهيز والتغليف</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">تغليف ملكي محكم</p>
              </div>

              <div className="bg-luxury-black/40 border border-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                  3
                </div>
                <h4 className="text-gray-300 text-xs font-bold">إصدار البوليصة</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">شحن عبر سمسا / بوليصة</p>
              </div>

              <div className="bg-luxury-black/40 border border-white/10 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">
                  4
                </div>
                <h4 className="text-gray-300 text-xs font-bold">التوصيل لباب بيتك</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">خلال 24-72 ساعة</p>
              </div>
            </div>
          </motion.div>

          {/* ── Quick Actions (WhatsApp Live Tracking + Official Tax Invoice Print) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-lg mx-auto"
          >
            {/* WhatsApp Live Tracking */}
            <a
              href={`https://wa.me/966500000000?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.813 2.796.814 3.183 0 5.769-2.587 5.77-5.768 0-3.182-2.588-5.768-5.77-5.768zm3.393 8.163c-.144.405-.837.774-1.17.823-.313.045-.688.064-2.001-.479-1.579-.652-2.573-2.261-2.651-2.366-.079-.105-.639-.851-.639-1.624 0-.773.406-1.155.55-1.311.144-.156.314-.195.419-.195.105 0 .21.002.302.007.097.005.228-.037.356.271.132.318.448 1.092.487 1.171.039.079.066.171.013.276-.052.105-.079.171-.157.263-.078.092-.165.206-.236.276-.079.078-.162.163-.07.321.092.158.409.675.877 1.092.602.536 1.109.702 1.267.781.157.079.25.066.342-.039.092-.105.394-.459.499-.617.105-.158.21-.131.355-.078.144.053.918.433 1.076.512.158.079.263.118.302.184.039.066.039.381-.105.786z"/>
              </svg>
              <span>متابعة الطلب عبر الواتساب</span>
            </a>

            {/* Official Tax Invoice Print Button */}
            <button
              onClick={() => {
                if (orderData) {
                  setShowInvoiceModal(true);
                } else {
                  handlePrintOfficialInvoice();
                }
              }}
              className="w-full sm:w-auto px-5 py-3.5 border border-luxury-gold/40 hover:border-luxury-gold text-luxury-gold hover:text-white font-bold rounded-xl hover:bg-luxury-gold/15 transition-all text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <svg className="w-4 h-4 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>عرض وطباعة الفاتورة الضريبية</span>
            </button>
          </motion.div>

          {/* Back to store */}
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-luxury-gold hover:text-luxury-gold-light transition-colors group"
            >
              <svg className="w-4 h-4 rtl:rotate-180 text-luxury-gold group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>العودة للمتجر واستكشاف باقي التشكيلة</span>
            </Link>
          </div>

        </section>
      </div>

      {/* ── Official Invoice Modal (Full Tax Invoice A4 View & Export) ───────── */}
      {showInvoiceModal && orderData && (
        <InvoiceModal
          order={orderData}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Hidden print container for direct printing if needed */}
      {orderData && (
        <div style={{ display: 'none' }}>
          <div ref={invoicePrintRef}>
            <InvoiceTemplate order={orderData} />
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
