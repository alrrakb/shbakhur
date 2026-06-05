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
    name: string;
    phone: string;
    additionalPhone: string;
    street: string;
    area: string;
    address: string;
    notes: string;
  };
  orderItems: { product_id: string | number; product_name: string; quantity: number; price: number; image?: string }[];
  discountValue: number;
  totalAfterDiscount: number;
}

export default function BankTransferPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const isNewOrder = resolvedParams.orderId === 'new';

  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [checkoutError, setCheckoutError] = useState(false);

  const [formData, setFormData] = useState({
    senderName: '',
    senderBank: '',
    senderAccount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bankDetails = {
    bankName: "مصرف الراجحي",
    accountName: "مؤسسة طلائع الركب للتسويق الالكتروني",
    accountNumber: "215608010987718",
    iban: "SA9280000215608010987718"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senderName || !formData.senderBank || !formData.senderAccount) {
      showToast('يرجى تعبئة جميع الحقول', 'error');
      return;
    }

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
          customer_area: fd.area,
          customer_street: fd.address ? `${fd.street || ''} (${fd.address})`.trim() : fd.street,
          additional_phone: fd.additionalPhone,
          notes: fd.notes,
          discount_amount: discountValue,
          payment_method: 'bank_transfer',
          items: orderItems,
        });

        if (!result.success || !result.order_id) {
          throw new Error(result.error || 'فشل إنشاء الطلب');
        }
        finalOrderId = result.order_id;
        finalOrderNumber = result.order_number || '';
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          sender_name: formData.senderName,
          sender_bank: formData.senderBank,
          sender_account: formData.senderAccount,
        })
        .eq('id', finalOrderId);

      if (updateError) throw updateError;

      // إرسال إشعار تيليجرام
      if (isNewOrder && pendingCheckout) {
        const { formData: fd, orderItems, discountValue, totalAfterDiscount } = pendingCheckout;
        fetch('/api/notify-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_number: finalOrderNumber,
            customer_name: fd.name,
            customer_phone: fd.phone,
            additional_phone: fd.additionalPhone || undefined,
            area: fd.area,
            address: `${fd.street ? fd.street + ' - ' : ''}${fd.address}`,
            notes: fd.notes || undefined,
            payment_method: 'bank_transfer',
            sender_name: formData.senderName,
            sender_bank: formData.senderBank,
            sender_account: formData.senderAccount,
            items: orderItems.map(i => ({
              product_name: i.product_name,
              quantity: i.quantity,
              price: i.price,
            })),
            subtotal: orderItems.reduce((s, i) => s + i.price * i.quantity, 0),
            discount: discountValue,
            total: totalAfterDiscount,
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

  return (
    <main className="min-h-screen bg-luxury-black">
      <Header />
      <div className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16">
        <section className="py-8 sm:py-12 relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 sm:mb-10"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">تأكيد الدفع</h1>
            {!isNewOrder && (
              <p className="text-gray-400 mb-2 text-sm sm:text-base">
                رقم الطلب: <span className="text-luxury-gold font-bold">{resolvedParams.orderId.slice(-6).toUpperCase()}</span>
              </p>
            )}
            <p className="text-gray-400 text-sm sm:text-base">الرجاء إتمام التحويل البنكي لحساب المؤسسة وإرفاق الإيصال لتأكيد طلبك.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bank Details Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-luxury-dark rounded-xl overflow-hidden shadow-[0_0_20px_rgba(212,175,55,0.1)] border border-luxury-gold/30 sticky top-32 h-fit relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

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
                <div className="space-y-4 text-base sm:text-xl">
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between border-b pb-4 border-luxury-gold/20 gap-1 sm:gap-2">
                    <span className="font-bold text-gray-400">رقم الحساب:</span>
                    <span className="font-mono tracking-wider text-luxury-gold text-sm sm:text-base">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center sm:justify-between pt-2 gap-1 sm:gap-2">
                    <span className="font-bold text-gray-400">الايبان:</span>
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

            {/* Transfer Details Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="bg-luxury-dark border border-luxury-gold/20 rounded-xl p-5 sm:p-8 space-y-4 sm:space-y-6">
                <h3 className="text-xl font-bold text-luxury-gold border-b border-luxury-gold/20 pb-4">بيانات التحويل المرسل</h3>

                <div>
                  <label className="block text-white mb-2">اسم صاحب الحساب *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="مثال: أحمد محمد عبد الله"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">اسم البنك *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderBank}
                    onChange={(e) => setFormData({ ...formData, senderBank: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="مثال: البنك الأهلي، مصرف الإنماء، إلخ"
                  />
                </div>

                <div>
                  <label className="block text-white mb-2">رقم الحساب الخاص بك *</label>
                  <input
                    type="text"
                    required
                    value={formData.senderAccount}
                    onChange={(e) => setFormData({ ...formData, senderAccount: e.target.value })}
                    className="w-full bg-luxury-black border border-luxury-gold/20 rounded px-4 py-3 text-white font-mono text-left focus:outline-none focus:border-luxury-gold transition-colors"
                    placeholder="رقم الحساب أو الآيبان"
                    dir="ltr"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || (isNewOrder && !pendingCheckout)}
                    className="w-full bg-luxury-gold text-luxury-black font-bold py-4 rounded-sm hover:bg-luxury-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-luxury-black/30 border-t-luxury-black rounded-full animate-spin"></div>
                        جاري الإرسال وتأكيد الطلب...
                      </>
                    ) : (
                      'أرفق البيانات وأتمم الطلب'
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
